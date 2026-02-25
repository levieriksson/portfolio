using FlightTracker.Backend.DTO;
using FlightTracker.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class AnalyticsController : ControllerBase
{
    private readonly FlightDbContext _db;

    public AnalyticsController(FlightDbContext db)
    {
        _db = db;
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity([FromQuery] string range = "24h")
    {
        range = (range ?? "24h").Trim().ToLowerInvariant();

        if (range != "24h" && range != "7d")
            return BadRequest("range must be 24h or 7d");

        var utcNow = DateTime.UtcNow;

        return range == "24h"
            ? Ok(await BuildHourlyAsync(utcNow))
            : Ok(await BuildDailyAsync(utcNow));
    }

    private async Task<AnalyticsActivityResponseDto> BuildHourlyAsync(DateTime utcNow)
    {

        var fromUtc = utcNow.AddHours(-24);

        var sessionBuckets = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.LastSeenUtc >= fromUtc)
            .GroupBy(s => new DateTime(
                s.LastSeenUtc.Year,
                s.LastSeenUtc.Month,
                s.LastSeenUtc.Day,
                s.LastSeenUtc.Hour,
                0,
                0,
                DateTimeKind.Utc))
            .Select(g => new { StartUtc = g.Key, Count = g.Count() })
            .ToListAsync();

        var enteredBuckets = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.EnteredSwedenUtc != null && s.EnteredSwedenUtc.Value >= fromUtc)
            .GroupBy(s => new DateTime(
                s.EnteredSwedenUtc!.Value.Year,
                s.EnteredSwedenUtc!.Value.Month,
                s.EnteredSwedenUtc!.Value.Day,
                s.EnteredSwedenUtc!.Value.Hour,
                0,
                0,
                DateTimeKind.Utc))
            .Select(g => new { StartUtc = g.Key, Count = g.Count() })
            .ToListAsync();


        var endHour = new DateTime(utcNow.Year, utcNow.Month, utcNow.Day, utcNow.Hour, 0, 0, DateTimeKind.Utc);

        var sessionMap = sessionBuckets.ToDictionary(x => x.StartUtc, x => x.Count);
        var enteredMap = enteredBuckets.ToDictionary(x => x.StartUtc, x => x.Count);

        var buckets = new List<ActivityBucketDto>(24);

        for (var i = 23; i >= 0; i--)
        {
            var start = endHour.AddHours(-i);

            buckets.Add(new ActivityBucketDto
            {
                StartUtc = start,
                SessionsSeen = sessionMap.TryGetValue(start, out var sCount) ? sCount : 0,
                EnteredSweden = enteredMap.TryGetValue(start, out var eCount) ? eCount : 0,
            });
        }

        return new AnalyticsActivityResponseDto
        {
            Range = "24h",
            Bucket = "hour",
            FromUtc = fromUtc,
            ToUtc = utcNow,
            Buckets = buckets
        };
    }

    private async Task<AnalyticsActivityResponseDto> BuildDailyAsync(DateTime utcNow)
    {

        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);

        var buckets = new List<ActivityBucketDto>(7);

        for (var i = 6; i >= 0; i--)
        {
            var localDate = nowLocal.Date.AddDays(-i);

            var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(localDate, tz);
            var dayEndUtc = TimeZoneInfo.ConvertTimeToUtc(localDate.AddDays(1), tz);

            var sessionsSeen = await _db.FlightSessions
                .AsNoTracking()
                .CountAsync(s => s.LastSeenUtc >= dayStartUtc && s.LastSeenUtc < dayEndUtc);

            var enteredSweden = await _db.FlightSessions
                .AsNoTracking()
                .CountAsync(s =>
                    s.EnteredSwedenUtc != null &&
                    s.EnteredSwedenUtc.Value >= dayStartUtc &&
                    s.EnteredSwedenUtc.Value < dayEndUtc);

            buckets.Add(new ActivityBucketDto
            {
                StartUtc = dayStartUtc,
                SessionsSeen = sessionsSeen,
                EnteredSweden = enteredSweden
            });
        }

        var fromUtc = buckets.Count > 0 ? buckets[0].StartUtc : utcNow;

        return new AnalyticsActivityResponseDto
        {
            Range = "7d",
            Bucket = "day",
            FromUtc = fromUtc,
            ToUtc = utcNow,
            Buckets = buckets
        };
    }
}