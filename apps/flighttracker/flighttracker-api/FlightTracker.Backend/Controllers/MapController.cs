using System.Globalization;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Controllers;

[ApiController]
[Route("api/map")]
public class MapController : ControllerBase
{
    private readonly FlightDbContext _db;

    public MapController(FlightDbContext db)
    {
        _db = db;
    }


    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] string bbox)
    {
        var parts = bbox.Split(',', StringSplitOptions.TrimEntries);
        if (parts.Length != 4 ||
            !double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var lonMin) ||
            !double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var latMin) ||
            !double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var lonMax) ||
            !double.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var latMax))
        {
            return BadRequest("Invalid bbox. Use lonMin,latMin,lonMax,latMax");
        }

        var lastSnapRaw = await _db.AircraftSnapshots
            .OrderByDescending(s => s.TimestampUtc)
            .Select(s => s.TimestampUtc)
            .FirstOrDefaultAsync();

        DateTime? lastSnapshotUtc =
            lastSnapRaw == default
                ? null
                : DateTime.SpecifyKind(lastSnapRaw, DateTimeKind.Utc);

        const double clampLonMin = 10.0;
        const double clampLonMax = 26.5;
        const double clampLatMin = 54.5;
        const double clampLatMax = 70.5;

        lonMin = Math.Max(lonMin, clampLonMin);
        lonMax = Math.Min(lonMax, clampLonMax);
        latMin = Math.Max(latMin, clampLatMin);
        latMax = Math.Min(latMax, clampLatMax);

        const int activeCutoffMinutes = 25;

        if (lonMin > lonMax || latMin > latMax)
        {
            return Ok(new
            {
                lastSnapshotUtc,
                activeNowCutoffMinutes = activeCutoffMinutes,
                items = Array.Empty<object>()
            });
        }

        var cutoff = DateTime.UtcNow.AddMinutes(-activeCutoffMinutes);

        var items = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.IsActive
                && s.LastSeenUtc >= cutoff
                && s.LastLatitude != null && s.LastLongitude != null
                && s.LastLatitude >= latMin && s.LastLatitude <= latMax
                && s.LastLongitude >= lonMin && s.LastLongitude <= lonMax)
            .Select(s => new
            {
                s.Id,
                s.Icao24,
                s.Callsign,
                lat = s.LastLatitude,
                lon = s.LastLongitude,
                alt = s.LastAltitude,
                vel = s.LastVelocity,
                trk = s.LastTrueTrack,
                s.LastSeenUtc,
                inSweden = s.LastInSweden
            })
            .ToListAsync();

        return Ok(new
        {
            lastSnapshotUtc,
            activeNowCutoffMinutes = activeCutoffMinutes,
            items
        });
    }
}
