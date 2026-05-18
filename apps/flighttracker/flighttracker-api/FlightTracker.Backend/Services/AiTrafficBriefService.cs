using FlightTracker.Backend.DTO;
using FlightTracker.Data;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Services;

public sealed class AiTrafficBriefService
{
    private readonly FlightDbContext _db;

    public AiTrafficBriefService(FlightDbContext db)
    {
        _db = db;
    }

    public async Task<AiTrafficBriefResponseDto> GenerateAsync(
        CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var currentFromUtc = utcNow.AddHours(-24);
        var previousFromUtc = utcNow.AddHours(-48);

        var currentSessions = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(s => s.LastSeenUtc >= currentFromUtc, cancellationToken);

        var previousSessions = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(
                s => s.LastSeenUtc >= previousFromUtc &&
                     s.LastSeenUtc < currentFromUtc,
                cancellationToken);

        decimal? percentChange = previousSessions == 0
            ? null
            : Math.Round(
                ((decimal)(currentSessions - previousSessions) / previousSessions) * 100m,
                1);

        var peakHour = await GetPeakHourAsync(currentFromUtc, cancellationToken);
        var topAirlines = await GetTopAirlinesAsync(currentFromUtc, cancellationToken);

        var headline = BuildHeadline(percentChange);
        var bullets = BuildBullets(
            currentSessions,
            previousSessions,
            percentChange,
            peakHour,
            topAirlines);

        var response = new AiTrafficBriefResponseDto
        {
            Headline = headline,
            Bullets = bullets,
            Confidence = currentSessions < 10 ? "low" : "medium",
            Caveats =
            [
                "This summary is generated from observed OpenSky sessions in the tracked region."
            ],
            GeneratedAtUtc = utcNow
        };

        return response;
    }

    private async Task<PeakHour?> GetPeakHourAsync(
        DateTime fromUtc,
        CancellationToken cancellationToken)
    {
        var buckets = await _db.FlightSessions
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
            .Select(g => new PeakHour(g.Key, g.Count()))
            .OrderByDescending(x => x.SessionCount)
            .FirstOrDefaultAsync(cancellationToken);

        return buckets;
    }

    private async Task<IReadOnlyList<TopAirline>> GetTopAirlinesAsync(
        DateTime fromUtc,
        CancellationToken cancellationToken)
    {
        var callsigns = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.LastSeenUtc >= fromUtc && s.Callsign != null)
            .Select(s => s.Callsign!)
            .ToListAsync(cancellationToken);

        return callsigns
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToUpperInvariant())
            .Where(c => c.Length >= 3)
            .Select(c => c[..3])
            .GroupBy(code => code)
            .Select(g => new TopAirline(g.Key, g.Count()))
            .OrderByDescending(x => x.SessionCount)
            .ThenBy(x => x.Code)
            .Take(3)
            .ToList();
    }

    private static string BuildHeadline(decimal? percentChange)
    {
        if (percentChange is null)
            return "Traffic activity is available for the current period";

        if (percentChange > 5)
            return "Traffic activity is higher than the previous period";

        if (percentChange < -5)
            return "Traffic activity is lower than the previous period";

        return "Traffic activity is steady compared with the previous period";
    }

    private static IReadOnlyList<string> BuildBullets(
        int currentSessions,
        int previousSessions,
        decimal? percentChange,
        PeakHour? peakHour,
        IReadOnlyList<TopAirline> topAirlines)
    {
        var bullets = new List<string>
        {
            $"Observed {currentSessions} sessions in the last 24 hours."
        };

        if (percentChange is null)
        {
            bullets.Add("No previous-period comparison is available yet.");
        }
        else
        {
            var direction = percentChange >= 0 ? "up" : "down";
            bullets.Add(
                $"Traffic is {direction} {Math.Abs(percentChange.Value)}% compared with the previous 24 hours.");
        }

        if (peakHour is not null)
        {
            var stockholmHour = TimeZoneInfo.ConvertTimeFromUtc(
                peakHour.StartUtc,
                TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm"));

            bullets.Add(
                $"Peak activity was around {stockholmHour:HH}:00 with {peakHour.SessionCount} sessions.");
        }

        if (topAirlines.Count > 0)
        {
            var top = topAirlines[0];
            bullets.Add(
                $"Top observed airline code was {top.Code} with {top.SessionCount} sessions.");
        }

        return bullets;
    }

    private sealed record PeakHour(DateTime StartUtc, int SessionCount);

    private sealed record TopAirline(string Code, int SessionCount);
}