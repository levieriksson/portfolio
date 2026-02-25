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
        public async Task<IActionResult> GetOverview([FromQuery] int windowHours = 24, [FromQuery] int activeCutoffMinutes = 25)
        {
            if (windowHours < 1) windowHours = 1;
            if (windowHours > 168) windowHours = 168;

            if (activeCutoffMinutes < 5) activeCutoffMinutes = 5;
            if (activeCutoffMinutes > 180) activeCutoffMinutes = 180;

            var utcNow = DateTime.UtcNow;
            var windowStart = utcNow.AddHours(-windowHours);
            var activeCutoff = utcNow.AddMinutes(-activeCutoffMinutes);

            var startOfToday = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);
            var startOfTomorrow = startOfToday.AddDays(1);

            var baseQuery = _db.FlightSessions.AsNoTracking();

            var activeNowQuery = baseQuery.Where(s => s.IsActive && s.LastSeenUtc >= activeCutoff);

            var activeNow = await activeNowQuery.CountAsync();

            var inSwedenNow = await activeNowQuery.CountAsync(s => s.LastKnownInSweden);

            var flightsToday = await baseQuery.CountAsync(s =>
                s.FirstSeenUtc >= startOfToday && s.FirstSeenUtc < startOfTomorrow);

            var sessionsStartedInWindow = await baseQuery.CountAsync(s => s.FirstSeenUtc >= windowStart);

            var uniqueAircraftInWindow = await baseQuery
                .Where(s => s.LastSeenUtc >= windowStart)
                .Select(s => s.Icao24)
                .Distinct()
                .CountAsync();

            var lastSessionSnap = await baseQuery
                .OrderByDescending(s => s.LastSnapshotUtc)
                .Select(s => s.LastSnapshotUtc)
                .FirstOrDefaultAsync();

            DateTime? lastSnapshotUtc =
                lastSessionSnap == null
                    ? null
                    : DateTime.SpecifyKind(lastSessionSnap.Value, DateTimeKind.Utc);

            return Ok(new
            {
                utcNow,
                windowHours,
                activeCutoffMinutes,
                lastSnapshotUtc,
                activeNow,
                inSwedenNow,
                flightsToday,
                sessionsStartedInWindow,
                uniqueAircraftInWindow
            });
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetToday([FromQuery] int activeCutoffMinutes = 25)
        {
            if (activeCutoffMinutes < 5) activeCutoffMinutes = 5;
            if (activeCutoffMinutes > 180) activeCutoffMinutes = 180;

            var utcNow = DateTime.UtcNow;
            var activeCutoff = utcNow.AddMinutes(-activeCutoffMinutes);

            var startOfToday = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);
            var startOfTomorrow = startOfToday.AddDays(1);

            var baseQuery = _db.FlightSessions.AsNoTracking();

            var activeNowQuery = baseQuery.Where(s => s.IsActive && s.LastSeenUtc >= activeCutoff);

            var activeNow = await activeNowQuery.CountAsync();
            var inSwedenNow = await activeNowQuery.CountAsync(s => s.LastKnownInSweden);

            var flightsToday = await baseQuery.CountAsync(s =>
                s.FirstSeenUtc >= startOfToday && s.FirstSeenUtc < startOfTomorrow);

            return Ok(new
            {
                utcNow,
                activeCutoffMinutes,
                flightsToday,
                activeNow,
                inSwedenNow
            });
        }
    }
}