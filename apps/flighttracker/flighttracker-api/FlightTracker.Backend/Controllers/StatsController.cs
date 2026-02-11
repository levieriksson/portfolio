using System;
using System.Linq;
using System.Threading.Tasks;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FlightTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class StatsController : ControllerBase
    {
        private readonly FlightDbContext _db;
        private readonly IConfiguration _config;

        public StatsController(FlightDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }


        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var utcNow = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            var start = utcNow.Date;
            var end = start.AddDays(1);

            var flightsToday = await _db.FlightSessions.CountAsync(s =>
                s.EnteredSwedenUtc != null &&
                s.EnteredSwedenUtc >= start && s.EnteredSwedenUtc < end);

            const int activeCutoffMinutes = 25;
            var cutoff = utcNow.AddMinutes(-activeCutoffMinutes);

            var activeNow = await _db.FlightSessions.CountAsync(s =>
                s.IsActive &&
                s.EnteredSwedenUtc != null &&
                s.LastSeenUtc >= cutoff);

            var lastSnapRaw = await _db.AircraftSnapshots
                .OrderByDescending(s => s.TimestampUtc)
                .Select(s => s.TimestampUtc)
                .FirstOrDefaultAsync();

            DateTime? lastSnapUtc =
                lastSnapRaw == default
                    ? null
                    : DateTime.SpecifyKind(lastSnapRaw, DateTimeKind.Utc);

            var snapCount = await _db.AircraftSnapshots.CountAsync();
            var sessionCount = await _db.FlightSessions.CountAsync();

            return Ok(new
            {
                activeNowCutoffMinutes = activeCutoffMinutes,
                utcNow,
                flightsTodayInSweden = flightsToday,
                activeFlightsInSweden = activeNow,
                lastSnapshotUtc = lastSnapUtc,
                snapshots = snapCount,
                sessions = sessionCount
            });
        }


        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var start = DateTime.UtcNow.Date;
            var end = start.AddDays(1);

            var flightsToday = await _db.FlightSessions.CountAsync(s =>
                s.EnteredSwedenUtc != null &&
                s.EnteredSwedenUtc >= start && s.EnteredSwedenUtc < end);

            const int activeCutoffMinutes = 25;
            var cutoff = DateTime.UtcNow.AddMinutes(-activeCutoffMinutes);

            var activeNow = await _db.FlightSessions.CountAsync(s =>
                s.IsActive &&
                s.EnteredSwedenUtc != null &&
                s.LastSeenUtc >= cutoff);

            var dbPath = TryGetSqliteDbPathFromConfig(_config);

            return Ok(new
            {
                activeNowCutoffMinutes = activeCutoffMinutes,
                flightsTodayInSweden = flightsToday,
                activeFlightsInSweden = activeNow,
                dbPath
            });
        }

        private static string? TryGetSqliteDbPathFromConfig(IConfiguration config)
        {
            var cs =
                config.GetConnectionString("FlightDb")
                ?? config.GetConnectionString("Default")
                ?? config.GetConnectionString("FlightTracker");

            if (string.IsNullOrWhiteSpace(cs))
                return null;

            const string key = "data source=";
            var idx = cs.IndexOf(key, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return null;

            var start = idx + key.Length;
            var end = cs.IndexOf(';', start);
            var value = end >= 0 ? cs[start..end] : cs[start..];

            value = value.Trim().Trim('"');
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }
}
