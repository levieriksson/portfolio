using FlightTracker.Backend.Data;
using FlightTracker.Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;

namespace FlightTracker.Backend.Services;

public sealed class OpenSkyIngestionService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenSkyAuthService _auth;
    private readonly OpenSkyOptions _options;
    private readonly ILogger<OpenSkyIngestionService> _logger;

    public OpenSkyIngestionService(
        IServiceProvider sp,
        IHttpClientFactory httpClientFactory,
        OpenSkyAuthService auth,
        IOptions<OpenSkyOptions> options,
        ILogger<OpenSkyIngestionService> logger)
    {
        _sp = sp;
        _httpClientFactory = httpClientFactory;
        _auth = auth;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Ingestion started. Interval={Interval}s, GapClose={Gap}s",
            _options.IntervalSeconds, _options.SessionGapSeconds);

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_options.IntervalSeconds));

        // Run immediately once
        await RunOnce(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunOnce(stoppingToken);
        }
    }

    private bool InSwedenBbox(double lat, double lon) =>
        lat >= _options.LatMin && lat <= _options.LatMax &&
        lon >= _options.LonMin && lon <= _options.LonMax;

    private async Task RunOnce(CancellationToken ct)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();

            var inv = CultureInfo.InvariantCulture;

            var statesUrl = $"{_options.StatesUrl}" +
                            $"?lamin={_options.LatMin.ToString(inv)}&lamax={_options.LatMax.ToString(inv)}" +
                            $"&lomin={_options.LonMin.ToString(inv)}&lomax={_options.LonMax.ToString(inv)}";

            var token = await _auth.GetAccessTokenAsync(ct);
            var client = _httpClientFactory.CreateClient("opensky");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            _logger.LogInformation("Fetching states at {UtcNow}", DateTime.UtcNow);

            using var resp = await client.GetAsync(statesUrl, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogError("OpenSky states request failed: {Status}. Url={Url}. Body={Body}",
                    (int)resp.StatusCode, statesUrl, body);

                // still close stale sessions even if fetch fails
                await CloseStaleSessionsAsync(db, DateTime.UtcNow, ct);
                await db.SaveChangesAsync(ct);
                return;
            }

            await using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            if (!doc.RootElement.TryGetProperty("states", out var states) || states.ValueKind != JsonValueKind.Array)
            {
                _logger.LogWarning("No states array returned.");
                await CloseStaleSessionsAsync(db, DateTime.UtcNow, ct);
                await db.SaveChangesAsync(ct);
                return;
            }

            var snapshots = new List<AircraftSnapshot>(capacity: 2048);

            foreach (var stateArray in states.EnumerateArray())
            {
                // OpenSky states format: [0]=icao24 [1]=callsign [2]=origin_country [4]=time_position [5]=lon [6]=lat [7]=baro_altitude [9]=velocity
                var lat = stateArray[6].GetDoubleOrNull();
                var lon = stateArray[5].GetDoubleOrNull();
                if (lat is null || lon is null) continue;

                // bbox should already filter, but keep a defensive check
                if (!InSwedenBbox(lat.Value, lon.Value)) continue;

                var tsUnix = stateArray[4].ValueKind == JsonValueKind.Number ? stateArray[4].GetInt64() : 0;
                if (tsUnix <= 0) continue;

                snapshots.Add(new AircraftSnapshot
                {
                    Icao24 = stateArray[0].GetString() ?? "",
                    Callsign = stateArray[1].GetString()?.Trim(),
                    OriginCountry = stateArray[2].GetString() ?? "",
                    Longitude = lon,
                    Latitude = lat,
                    Altitude = stateArray[7].GetDoubleOrNull(),
                    Velocity = stateArray[9].GetDoubleOrNull(),
                    TimestampUtc = DateTimeOffset.FromUnixTimeSeconds(tsUnix).UtcDateTime,

                    // Right now, "InSweden" means "inside our ingestion bbox".
                    // Later we can upgrade this to a Sweden polygon check.
                    InSweden = true
                });
            }

            var nowUtc = DateTime.UtcNow;

            // Always close stale sessions (even if no snapshots)
            await CloseStaleSessionsAsync(db, nowUtc, ct);

            if (snapshots.Count == 0)
            {
                _logger.LogInformation("No snapshots in bbox this tick.");
                await db.SaveChangesAsync(ct);
                return;
            }

            await SaveSnapshotsAndUpdateSessionsAsync(db, snapshots, nowUtc, ct);

            _logger.LogInformation("Saved {Count} snapshots.", snapshots.Count);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // normal shutdown
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ingestion run failed.");
        }
    }

    private async Task CloseStaleSessionsAsync(FlightDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var gap = TimeSpan.FromSeconds(_options.SessionGapSeconds);
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
        var gap = TimeSpan.FromSeconds(_options.SessionGapSeconds);

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
                    // close old
                    session.IsActive = false;
                    session.EndUtc = session.LastSeenUtc;
                    session.CloseReason = "gap_timeout";

                    // new
                    session = NewSessionFromSnapshot(snap);
                    db.FlightSessions.Add(session);
                    byIcao[group.Icao] = session;
                }

                // attach
                snap.FlightSession = session;
                session.LastSeenUtc = snap.TimestampUtc;
                session.SnapshotCount++;

                if (!string.IsNullOrWhiteSpace(snap.Callsign))
                    session.Callsign = snap.Callsign;

                if (snap.Altitude is double alt)
                {
                    session.MaxAltitude = session.MaxAltitude.HasValue
                        ? Math.Max(session.MaxAltitude.Value, alt)
                        : alt;

                    // running avg
                    session.AvgAltitude = session.AvgAltitude.HasValue
                        ? session.AvgAltitude + (alt - session.AvgAltitude.Value) / session.SnapshotCount
                        : alt;
                }

                // Sweden entry time for "flights today"
                session.EnteredSwedenUtc ??= snap.TimestampUtc;
                session.ExitedSwedenUtc = null;
            }
        }

        db.AircraftSnapshots.AddRange(snapshots);
        await db.SaveChangesAsync(ct);
    }

    private FlightSession NewSessionFromSnapshot(AircraftSnapshot snap)
        => new FlightSession
        {
            Icao24 = snap.Icao24,
            Callsign = snap.Callsign,
            FirstSeenUtc = snap.TimestampUtc,
            LastSeenUtc = snap.TimestampUtc,
            IsActive = true,
            SnapshotCount = 0,
            EnteredSwedenUtc = snap.InSweden ? snap.TimestampUtc : null
        };
}
