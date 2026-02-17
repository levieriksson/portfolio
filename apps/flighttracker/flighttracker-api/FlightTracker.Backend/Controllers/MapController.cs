using System.Globalization;
using FlightTracker.Backend.DTO;
using FlightTracker.Backend.Options;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FlightTracker.Backend.Controllers;

[ApiController]
[Route("api/map")]
public class MapController : ControllerBase
{
    private readonly FlightDbContext _db;
    private readonly MapBoundsOptions _bounds;

    public MapController(FlightDbContext db, IOptions<MapBoundsOptions> bounds)
    {
        _db = db;
        _bounds = bounds.Value;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] string? bbox)
    {
        if (!TryGetBounds(bbox, out var lonMin, out var latMin, out var lonMax, out var latMax, out var error))
            return BadRequest(error);

        const int activeCutoffMinutes = 25;

        if (lonMin > lonMax || latMin > latMax)
        {
            return Ok(new MapActiveResponse(
                LastSnapshotUtc: null,
                ActiveNowCutoffMinutes: activeCutoffMinutes,
                Items: Array.Empty<MapActiveItem>()
            ));
        }

        var lastSnapRaw = await _db.AircraftSnapshots
            .OrderByDescending(s => s.TimestampUtc)
            .Select(s => s.TimestampUtc)
            .FirstOrDefaultAsync();

        DateTime? lastSnapshotUtc =
            lastSnapRaw == default
                ? null
                : DateTime.SpecifyKind(lastSnapRaw, DateTimeKind.Utc);

        var cutoff = DateTime.UtcNow.AddMinutes(-activeCutoffMinutes);

        var items = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.IsActive
                && s.LastSeenUtc >= cutoff
                && s.LastLatitude != null && s.LastLongitude != null
                && s.LastLatitude >= latMin && s.LastLatitude <= latMax
                && s.LastLongitude >= lonMin && s.LastLongitude <= lonMax)
            .Select(s => new MapActiveItem(
                Id: s.Id,
                Icao24: s.Icao24,
                Callsign: s.Callsign,
                Lat: s.LastLatitude!.Value,
                Lon: s.LastLongitude!.Value,
                Alt: s.LastAltitude,
                Vel: s.LastVelocity,
                Trk: s.LastTrueTrack,
                LastSeenUtc: s.LastSeenUtc,
                InSweden: s.LastInSweden
            ))
            .ToListAsync();

        return Ok(new MapActiveResponse(
            LastSnapshotUtc: lastSnapshotUtc,
            ActiveNowCutoffMinutes: activeCutoffMinutes,
            Items: items
        ));
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? bbox,
        [FromQuery] int limit = 100)
    {
        if (!TryGetBounds(bbox, out var lonMin, out var latMin, out var lonMax, out var latMax, out var error))
            return BadRequest(error);

        q = (q ?? "").Trim();
        if (q.Length < 2)
        {
            return Ok(new MapSearchResponse(
                Limit: ClampLimit(limit),
                Items: Array.Empty<MapSearchItem>()
            ));
        }

        const int activeCutoffMinutes = 25;

        if (lonMin > lonMax || latMin > latMax)
        {
            return Ok(new MapSearchResponse(
                Limit: ClampLimit(limit),
                Items: Array.Empty<MapSearchItem>()
            ));
        }

        var cutoff = DateTime.UtcNow.AddMinutes(-activeCutoffMinutes);
        var pattern = $"%{q}%";
        var take = ClampLimit(limit);

        var baseSessions = _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.IsActive
                && s.LastSeenUtc >= cutoff
                && s.LastLatitude != null && s.LastLongitude != null
                && s.LastLatitude >= latMin && s.LastLatitude <= latMax
                && s.LastLongitude >= lonMin && s.LastLongitude <= lonMax);

        var items = await (
            from s in baseSessions
            join a in _db.AircraftMetadata.AsNoTracking()
                on s.Icao24 equals a.Icao24 into meta
            from a in meta.DefaultIfEmpty()
            where
                (s.Callsign != null && EF.Functions.ILike(s.Callsign, pattern)) ||
                EF.Functions.ILike(s.Icao24, pattern) ||
                (a != null && a.OperatorName != null && EF.Functions.ILike(a.OperatorName, pattern)) ||
                (a != null && a.Model != null && EF.Functions.ILike(a.Model, pattern)) ||
                (a != null && a.TypeCode != null && EF.Functions.ILike(a.TypeCode, pattern))
            orderby s.LastSeenUtc descending
            select new MapSearchItem(
                SessionId: s.Id,
                Icao24: s.Icao24,
                Callsign: s.Callsign,
                LastSeenUtc: s.LastSeenUtc,
                OperatorName: a != null ? a.OperatorName : null,
                Model: a != null ? a.Model : null,
                TypeCode: a != null ? a.TypeCode : null
            )
        )
        .Take(take)
        .ToListAsync();

        return Ok(new MapSearchResponse(
            Limit: take,
            Items: items
        ));
    }

    private int ClampLimit(int limit)
    {
        if (limit < 1) return 1;
        if (limit > 200) return 200;
        return limit;
    }

    private bool TryGetBounds(
        string? bbox,
        out double lonMin,
        out double latMin,
        out double lonMax,
        out double latMax,
        out string error)
    {

        lonMin = _bounds.DefaultLonMin;
        latMin = _bounds.DefaultLatMin;
        lonMax = _bounds.DefaultLonMax;
        latMax = _bounds.DefaultLatMax;

        if (!string.IsNullOrWhiteSpace(bbox))
        {
            var parts = bbox.Split(',', StringSplitOptions.TrimEntries);
            if (parts.Length != 4 ||
                !double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out lonMin) ||
                !double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out latMin) ||
                !double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out lonMax) ||
                !double.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out latMax))
            {
                error = "Invalid bbox. Use lonMin,latMin,lonMax,latMax (decimal dot).";
                return false;
            }
        }


        lonMin = Math.Max(lonMin, _bounds.ClampLonMin);
        lonMax = Math.Min(lonMax, _bounds.ClampLonMax);
        latMin = Math.Max(latMin, _bounds.ClampLatMin);
        latMax = Math.Min(latMax, _bounds.ClampLatMax);

        error = "";
        return true;
    }
}
