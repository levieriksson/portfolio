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

    [HttpGet("activity-change")]
    public async Task<IActionResult> GetActivityChange()
    {
        var utcNow = DateTime.UtcNow;

        return Ok(await BuildActivityChangeAsync(utcNow));
    }

    private async Task<AnalyticsChangeResponseDto> BuildActivityChangeAsync(DateTime utcNow)
    {
        var currentFromUtc = utcNow.AddHours(-24);
        var previousFromUtc = utcNow.AddHours(-48);
        var previousToUtc = currentFromUtc;

        var currentSessions = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(s => s.LastSeenUtc >= currentFromUtc);

        var previousSessions = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(s =>
                s.LastSeenUtc >= previousFromUtc &&
                s.LastSeenUtc < previousToUtc);

        decimal? percentChange = previousSessions == 0
            ? null
            : Math.Round(
                ((decimal)(currentSessions - previousSessions) / previousSessions) * 100m,
                1);

        return new AnalyticsChangeResponseDto(
            currentSessions,
            previousSessions,
            percentChange);
    }


    [HttpGet("top-airlines")]
    public async Task<IActionResult> GetTopAirlines([FromQuery] string range = "24h")
    {
        range = (range ?? "24h").Trim().ToLowerInvariant();

        if (range != "24h" && range != "7d")
            return BadRequest("range must be 24h or 7d");

        var utcNow = DateTime.UtcNow;

        return Ok(await BuildTopAirlinesAsync(range, utcNow));
    }

    private async Task<TopAirlinesResponseDto> BuildTopAirlinesAsync(string range, DateTime utcNow)
    {
        var fromUtc = range == "24h"
            ? utcNow.AddHours(-24)
            : utcNow.AddDays(-7);

        var callsigns = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.LastSeenUtc >= fromUtc && s.Callsign != null)
            .Select(s => s.Callsign!)
            .ToListAsync();

        var items = callsigns
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToUpperInvariant())
            .Where(c => c.Length >= 3)
            .Select(c => c.Substring(0, 3))
            .GroupBy(code => code)
            .Select(g => new TopAirlineItemDto(
                g.Key,
                g.Count()))
            .OrderByDescending(x => x.SessionCount)
            .ThenBy(x => x.AirlineCode)
            .Take(5)
            .ToList();

        return new TopAirlinesResponseDto(
            range,
            items);
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