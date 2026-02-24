using FlightTracker.Data;
using FlightTracker.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using FlightTracker.Ingestion.Helpers;
using FlightTracker.Ingestion.Options;

namespace FlightTracker.Ingestion.Services;


public sealed class OpenSkyIngestionRunner
{
    private readonly IServiceProvider _sp;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenSkyAuthService _auth;
    private readonly OpenSkyOptions _openSky;
    private readonly RegionBoundsOptions _region;
    private readonly IngestionOptions _ingestion;
    private readonly ILogger<OpenSkyIngestionRunner> _logger;
    private readonly SwedenTerritoryService _sweden;

    private DateTime _lastCleanupUtc = DateTime.MinValue;

    public OpenSkyIngestionRunner(
    IServiceProvider sp,
    IHttpClientFactory httpClientFactory,
    OpenSkyAuthService auth,
    IOptions<OpenSkyOptions> openSky,
    IOptions<RegionBoundsOptions> region,
    IOptions<IngestionOptions> ingestion,
    SwedenTerritoryService sweden,
    ILogger<OpenSkyIngestionRunner> logger)
    {
        _sp = sp;
        _httpClientFactory = httpClientFactory;
        _auth = auth;
        _openSky = openSky.Value;
        _region = region.Value;
        _ingestion = ingestion.Value;
        _logger = logger;
        _sweden = sweden;
    }

    public async Task RunOnceAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();

            var inv = CultureInfo.InvariantCulture;

            var statesUrl = $"{_openSky.StatesUrl}" +
                $"?lamin={_region.LatMin.ToString(inv)}&lamax={_region.LatMax.ToString(inv)}" +
                $"&lomin={_region.LonMin.ToString(inv)}&lomax={_region.LonMax.ToString(inv)}";

            var token = await _auth.GetAccessTokenAsync(ct);
            var client = _httpClientFactory.CreateClient("opensky");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var nowUtc = DateTime.UtcNow;
            _logger.LogInformation("Fetching states at {UtcNow}", nowUtc);

            using var resp = await client.GetAsync(statesUrl, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogError("OpenSky states request failed: {Status}. Url={Url}. Body={Body}",
                    (int)resp.StatusCode, statesUrl, body);

                await CloseStaleSessionsAsync(db, nowUtc, ct);
                await db.SaveChangesAsync(ct);

                await CleanupIfDueAsync(db, nowUtc, ct);
                return;
            }

            await using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            if (!doc.RootElement.TryGetProperty("states", out var states) || states.ValueKind != JsonValueKind.Array)
            {
                _logger.LogWarning("No states array returned.");

                await CloseStaleSessionsAsync(db, nowUtc, ct);
                await db.SaveChangesAsync(ct);

                await CleanupIfDueAsync(db, nowUtc, ct);
                return;
            }

            var snapshots = new List<AircraftSnapshot>(capacity: 2048);

            foreach (var stateArray in states.EnumerateArray())
            {
                var lat = stateArray[6].GetDoubleOrNull();
                var lon = stateArray[5].GetDoubleOrNull();
                if (lat is null || lon is null) continue;

                if (!InRegionBbox(lat.Value, lon.Value)) continue;

                var tsUnix = stateArray[4].ValueKind == JsonValueKind.Number ? stateArray[4].GetInt64() : 0;
                if (tsUnix <= 0) continue;

                var trueTrack = NormalizeTrack(stateArray[10].GetDoubleOrNull());

                bool? onGround = null;
                if (stateArray.GetArrayLength() > 8)
                {
                    onGround =
                        stateArray[8].ValueKind == JsonValueKind.True ? true :
                        stateArray[8].ValueKind == JsonValueKind.False ? false :
                        (bool?)null;
                }
                snapshots.Add(new AircraftSnapshot
                {
                    Icao24 = stateArray[0].GetString() ?? "",
                    Callsign = stateArray[1].GetString()?.Trim(),
                    OriginCountry = stateArray[2].GetString() ?? "",
                    Longitude = lon,
                    Latitude = lat,
                    Altitude = stateArray[7].GetDoubleOrNull(),
                    Velocity = stateArray[9].GetDoubleOrNull(),
                    TrueTrack = trueTrack,
                    TimestampUtc = DateTimeOffset.FromUnixTimeSeconds(tsUnix).UtcDateTime,
                    InSweden = _sweden.IsInside(lat.Value, lon.Value),
                    OnGround = onGround,
                });
            }

            if (snapshots.Count == 0)
            {
                _logger.LogInformation("No snapshots in region this tick.");


                await CloseStaleSessionsAsync(db, nowUtc, ct);
                await db.SaveChangesAsync(ct);

                await CleanupIfDueAsync(db, nowUtc, ct);
                return;
            }


            await SaveSnapshotsAndUpdateSessionsAsync(db, snapshots, nowUtc, ct);
            _logger.LogInformation("Saved {Count} snapshots.", snapshots.Count);


            await CloseStaleSessionsAsync(db, nowUtc, ct);
            await db.SaveChangesAsync(ct);

            await CleanupIfDueAsync(db, nowUtc, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ingestion run failed.");
            throw;
        }
    }


    private bool InRegionBbox(double lat, double lon) =>
        lat >= _region.LatMin && lat <= _region.LatMax &&
        lon >= _region.LonMin && lon <= _region.LonMax;

    private static double? NormalizeTrack(double? t)
    {
        if (t is null) return null;
        if (double.IsNaN(t.Value) || double.IsInfinity(t.Value)) return null;
        var v = t.Value % 360.0;
        if (v < 0) v += 360.0;
        return v;
    }

    private async Task CloseStaleSessionsAsync(FlightDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var gap = TimeSpan.FromSeconds(_ingestion.SessionGapSeconds);
        var cutoff = nowUtc - gap;

        var stale = await db.FlightSessions
            .Where(s => s.IsActive && s.LastSeenUtc < cutoff)
            .ToListAsync(ct);

        foreach (var s in stale)
        {
            s.IsActive = false;
            s.EndUtc = s.LastSeenUtc;
            s.CloseReason = "gap_timeout";
        }

        if (stale.Count > 0)
            _logger.LogInformation("Closed {Count} stale sessions.", stale.Count);
    }

    private async Task SaveSnapshotsAndUpdateSessionsAsync(
        FlightDbContext db,
        List<AircraftSnapshot> snapshots,
        DateTime nowUtc,
        CancellationToken ct)
    {
        var gap = TimeSpan.FromSeconds(_ingestion.SessionGapSeconds);

        var icaos = snapshots.Select(s => s.Icao24).Distinct().ToList();

        var activeSessions = await db.FlightSessions
            .Where(s => s.IsActive && icaos.Contains(s.Icao24))
            .ToListAsync(ct);

        var byIcao = activeSessions.ToDictionary(s => s.Icao24);

        foreach (var group in snapshots
            .GroupBy(s => s.Icao24)
            .Select(g => new { Icao = g.Key, Items = g.OrderBy(x => x.TimestampUtc).ToList() }))
        {
            byIcao.TryGetValue(group.Icao, out var session);

            foreach (var snap in group.Items)
            {
                if (session == null)
                {
                    session = NewSessionFromSnapshot(snap);
                    db.FlightSessions.Add(session);
                    byIcao[group.Icao] = session;
                }
                else if (snap.TimestampUtc - session.LastSeenUtc > gap)
                {
                    session.IsActive = false;
                    session.EndUtc = session.LastSeenUtc;
                    session.CloseReason = "gap_timeout";

                    session = NewSessionFromSnapshot(snap);
                    db.FlightSessions.Add(session);
                    byIcao[group.Icao] = session;
                }

                snap.FlightSession = session;

                session.LastSeenUtc = snap.TimestampUtc;
                session.LastLatitude = snap.Latitude;
                session.LastLongitude = snap.Longitude;
                session.LastAltitude = snap.Altitude;
                session.LastVelocity = snap.Velocity;
                session.LastTrueTrack = snap.TrueTrack;
                session.LastSnapshotUtc = snap.TimestampUtc;

                var wasInSweden = session.LastInSweden;

                if (!wasInSweden && snap.InSweden)
                {
                    session.EnteredSwedenUtc ??= snap.TimestampUtc;
                    session.ExitedSwedenUtc = null;
                }

                if (wasInSweden && !snap.InSweden)
                {
                    session.ExitedSwedenUtc = snap.TimestampUtc;
                }

                session.LastInSweden = snap.InSweden;
                session.SnapshotCount++;

                if (!string.IsNullOrWhiteSpace(snap.Callsign))
                    session.Callsign = snap.Callsign;

                if (snap.OnGround == false && snap.Altitude is double alt && alt > 0)
                {
                    session.AirborneSnapshotCount++;

                    session.MaxAltitude = session.MaxAltitude.HasValue
                        ? Math.Max(session.MaxAltitude.Value, alt)
                        : alt;

                    session.AvgAltitude = session.AvgAltitude.HasValue
                        ? session.AvgAltitude + (alt - session.AvgAltitude.Value) / session.AirborneSnapshotCount
                        : alt;
                }


            }
        }

        db.AircraftSnapshots.AddRange(snapshots);
        await db.SaveChangesAsync(ct);
    }

    private static FlightSession NewSessionFromSnapshot(AircraftSnapshot snap)
        => new FlightSession
        {
            Icao24 = snap.Icao24,
            Callsign = snap.Callsign,
            FirstSeenUtc = snap.TimestampUtc,
            LastSeenUtc = snap.TimestampUtc,
            IsActive = true,
            SnapshotCount = 0,
            EnteredSwedenUtc = snap.InSweden ? snap.TimestampUtc : null,
            ExitedSwedenUtc = null,
            LastLatitude = snap.Latitude,
            LastLongitude = snap.Longitude,
            LastAltitude = snap.Altitude,
            LastVelocity = snap.Velocity,
            LastTrueTrack = snap.TrueTrack,
            LastSnapshotUtc = snap.TimestampUtc,
            LastInSweden = snap.InSweden

        };

    private async Task CleanupIfDueAsync(FlightDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var hours = _ingestion.CleanupEveryHours <= 0 ? 6 : _ingestion.CleanupEveryHours;
        var every = TimeSpan.FromHours(hours);

        if (_lastCleanupUtc != DateTime.MinValue && (nowUtc - _lastCleanupUtc) < every)
            return;

        await CleanupOldDataAsync(db, nowUtc, ct);

        _lastCleanupUtc = nowUtc;
    }

    private async Task CleanupOldDataAsync(FlightDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var snapCutoff = nowUtc.AddDays(-_ingestion.SnapshotRetentionDays);
        var sessionCutoff = nowUtc.AddDays(-_ingestion.SessionRetentionDays);

        var deletedSnaps = await db.AircraftSnapshots
            .Where(s => s.TimestampUtc < snapCutoff)
            .ExecuteDeleteAsync(ct);

        var deletedSessions = await db.FlightSessions
            .Where(s => !s.IsActive && s.EndUtc != null && s.EndUtc < sessionCutoff)
            .ExecuteDeleteAsync(ct);

        _logger.LogInformation(
            "Cleanup done. Deleted snapshots={SnapshotsDeleted}, sessions={SessionsDeleted}. SnapCutoff={SnapCutoff:o}, SessionCutoff={SessionCutoff:o}",
            deletedSnaps, deletedSessions, snapCutoff, sessionCutoff);
    }
}
