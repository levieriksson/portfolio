using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace FlightTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class FlightsController : ControllerBase
    {
        private readonly FlightDbContext _db;

        public FlightsController(FlightDbContext db)
        {
            _db = db;
        }


        [HttpGet]
        public async Task<IActionResult> GetFlights(
            [FromQuery] string date,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] bool? activeOnly,
            [FromQuery] string? q,
            [FromQuery] string? sort)
        {
            if (!DateTime.TryParseExact(
                    date,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                    out var parsed))
            {
                return BadRequest("Invalid date. Use YYYY-MM-DD.");
            }

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            if (pageSize > 200) pageSize = 200;

            var dayStart = DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
            var dayEnd = dayStart.AddDays(1);

            var utcNow = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            const int activeCutoffMinutes = 25;
            var cutoff = utcNow.AddMinutes(-activeCutoffMinutes);

            var query = _db.FlightSessions
                .AsNoTracking()
                .Where(s =>
                    s.EnteredSwedenUtc != null &&
                    s.EnteredSwedenUtc >= dayStart &&
                    s.EnteredSwedenUtc < dayEnd);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();


                var pattern = $"%{term}%";

                if (_db.Database.IsNpgsql())
                {

                    query = query.Where(s =>
                        (s.Callsign != null && EF.Functions.ILike(s.Callsign, pattern)) ||
                        EF.Functions.ILike(s.Icao24, pattern));
                }
                else
                {

                    query = query.Where(s =>
                        (s.Callsign != null &&
                         EF.Functions.Like(EF.Functions.Collate(s.Callsign, "NOCASE"), pattern)) ||
                        EF.Functions.Like(EF.Functions.Collate(s.Icao24, "NOCASE"), pattern));
                }
            }

            if (activeOnly == true)
            {
                query = query.Where(s => s.IsActive && s.LastSeenUtc >= cutoff);
            }

            query = (sort ?? "lastSeenDesc") switch
            {
                "firstSeenAsc" => query.OrderBy(s => s.FirstSeenUtc),
                "firstSeenDesc" => query.OrderByDescending(s => s.FirstSeenUtc),
                "lastSeenAsc" => query.OrderBy(s => s.LastSeenUtc),
                _ => query.OrderByDescending(s => s.LastSeenUtc),
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.Id,
                    s.Icao24,
                    s.Callsign,
                    s.FirstSeenUtc,
                    s.LastSeenUtc,
                    s.EndUtc,
                    s.IsActive,
                    s.SnapshotCount,
                    s.MaxAltitude,

                    aircraft = _db.AircraftMetadata
                        .Where(a => a.Icao24 == s.Icao24)
                        .Select(a => new
                        {
                            a.TypeCode,
                            a.OperatorName,
                            a.Model
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                date = parsed.Date.ToString("yyyy-MM-dd"),
                page,
                pageSize,
                total,
                activeNowCutoffMinutes = activeCutoffMinutes,
                items
            });
        }


        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var session = await _db.FlightSessions
                .AsNoTracking()
                .Where(s => s.Id == id)
                .Select(s => new
                {
                    s.Id,
                    s.Icao24,
                    s.Callsign,
                    s.FirstSeenUtc,
                    s.LastSeenUtc,
                    s.EndUtc,
                    s.IsActive,
                    s.SnapshotCount,
                    s.MaxAltitude,
                    s.AvgAltitude,
                    s.EnteredSwedenUtc,
                    s.ExitedSwedenUtc,
                    s.CloseReason,

                    aircraft = _db.AircraftMetadata
                        .Where(a => a.Icao24 == s.Icao24)
                        .Select(a => new
                        {
                            a.TypeCode,
                            a.ManufacturerName,
                            a.Model,
                            a.Registration,
                            a.OperatorIcao,
                            a.OperatorName,
                            a.Country,
                            a.CategoryDescription
                        })
                        .FirstOrDefault(),

                    snapshots = s.Snapshots
                        .OrderBy(x => x.TimestampUtc)
                        .Select(x => new
                        {
                            x.Id,
                            x.TimestampUtc,
                            x.Latitude,
                            x.Longitude,
                            x.Altitude,
                            x.Velocity,
                            x.Callsign,
                            x.OriginCountry
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            return session is null ? NotFound() : Ok(session);
        }
    }
}
