using System;
using System.Linq;
using System.Threading.Tasks;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class StatsController : ControllerBase
    {
        private readonly FlightDbContext _db;

        public StatsController(FlightDbContext db)
        {
            _db = db;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var utcNow = DateTime.UtcNow;


            var start = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);
            var end = start.AddDays(1);

            var flightsToday = await _db.FlightSessions.CountAsync(s =>
                s.EnteredSwedenUtc != null &&
                s.EnteredSwedenUtc >= start &&
                s.EnteredSwedenUtc < end);

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

            DateTime? lastSnapshotUtc =
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
                lastSnapshotUtc,
                snapshots = snapCount,
                sessions = sessionCount
            });
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var utcNow = DateTime.UtcNow;


            var start = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);
            var end = start.AddDays(1);

            var flightsToday = await _db.FlightSessions.CountAsync(s =>
                s.EnteredSwedenUtc != null &&
                s.EnteredSwedenUtc >= start &&
                s.EnteredSwedenUtc < end);

            const int activeCutoffMinutes = 25;
            var cutoff = utcNow.AddMinutes(-activeCutoffMinutes);

            var activeNow = await _db.FlightSessions.CountAsync(s =>
                s.IsActive &&
                s.EnteredSwedenUtc != null &&
                s.LastSeenUtc >= cutoff);

            return Ok(new
            {
                activeNowCutoffMinutes = activeCutoffMinutes,
                flightsTodayInSweden = flightsToday,
                activeFlightsInSweden = activeNow
            });
        }
    }
}
