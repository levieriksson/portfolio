using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FlightTracker.Backend.DTO;
using FlightTracker.Data;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Services;

public sealed class AiTrafficBriefService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly FlightDbContext _db;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AiTrafficBriefService(
        FlightDbContext db,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _db = db;
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<AiTrafficBriefResponseDto> GenerateAsync(
        CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var facts = await BuildFactsAsync(utcNow, cancellationToken);

        var fallback = BuildFallbackResponse(facts, utcNow);
        var aiResponse = await TryGenerateAiResponseAsync(facts, utcNow, cancellationToken);

        return aiResponse ?? fallback;
    }

    private async Task<AiTrafficBriefResponseDto?> TryGenerateAiResponseAsync(
        TrafficBriefFacts facts,
        DateTime generatedAtUtc,
        CancellationToken cancellationToken)
    {
        var apiKey = _configuration["OPENAI_API_KEY"];

        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

        var payload = new
        {
            model,
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = "ai_traffic_brief",
                    strict = true,
                    schema = new
                    {
                        type = "object",
                        additionalProperties = false,
                        properties = new
                        {
                            headline = new { type = "string" },
                            bullets = new
                            {
                                type = "array",
                                minItems = 3,
                                maxItems = 5,
                                items = new { type = "string" }
                            },
                            confidence = new
                            {
                                type = "string",
                                @enum = new[] { "low", "medium", "high" }
                            },
                            caveats = new
                            {
                                type = "array",
                                maxItems = 3,
                                items = new { type = "string" }
                            }
                        },
                        required = new[]
                        {
                            "headline",
                            "bullets",
                            "confidence",
                            "caveats"
                        }
                    }
                }
            },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = """
You are an aviation analytics assistant for a portfolio project.

Use only the provided data.
Do not invent causes such as weather, strikes, delays, airports, incidents, or operational explanations.
Do not claim the data represents complete gate-to-gate flights.
Do not use forecast, projected, predicted, expected, or other future-looking language.
All provided metrics are observed historical or current values.
Use 24-hour time format (for example 16:00, not 4 PM).
Write concise, recruiter-friendly product language.
Return only data matching the provided schema.
"""
                },
                new
                {
                    role = "user",
                    content = $$"""
                    Create an AI traffic brief from this analytics snapshot.

                    Analytics snapshot:
                    {{JsonSerializer.Serialize(ToPromptPayload(facts), JsonOptions)}}
                    """
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(error);
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var completion = JsonSerializer.Deserialize<OpenAiChatCompletionResponse>(responseJson, JsonOptions);
        var content = completion?.Choices?.FirstOrDefault()?.Message?.Content;

        if (string.IsNullOrWhiteSpace(content))
            return null;

        var aiBrief = JsonSerializer.Deserialize<AiBriefModelResponse>(content, JsonOptions);

        if (aiBrief is null ||
            string.IsNullOrWhiteSpace(aiBrief.Headline) ||
            aiBrief.Bullets.Count < 3)
        {
            return null;
        }

        return new AiTrafficBriefResponseDto
        {
            Headline = aiBrief.Headline,
            Bullets = aiBrief.Bullets.Take(5).ToList(),
            Confidence = NormalizeConfidence(aiBrief.Confidence),
            Caveats = aiBrief.Caveats.Count > 0 ? aiBrief.Caveats.Take(3).ToList() : facts.Caveats,
            GeneratedAtUtc = generatedAtUtc,
            Source = "openai"
        };
    }

    private async Task<TrafficBriefFacts> BuildFactsAsync(
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
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

        var activeCutoff = utcNow.AddMinutes(-25);

        var activeNow = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(
                s => s.IsActive && s.LastSeenUtc >= activeCutoff,
                cancellationToken);

        var inSwedenNow = await _db.FlightSessions
            .AsNoTracking()
            .CountAsync(
                s => s.IsActive &&
                     s.LastSeenUtc >= activeCutoff &&
                     s.LastKnownInSweden,
                cancellationToken);

        var hourlyBuckets = await GetHourlyBucketsAsync(currentFromUtc, utcNow, cancellationToken);
        var peakHour = GetPeakHour(hourlyBuckets);
        var averageHourlySessions = Math.Round(hourlyBuckets.Average(x => x.SessionCount), 1);

        var topAirlines = await GetTopAirlinesAsync(currentFromUtc, cancellationToken);
        var busiestDay = await GetBusiestDayAsync(utcNow, cancellationToken);
        var trendPattern = GetTrendPattern(hourlyBuckets);

        return new TrafficBriefFacts(
            CurrentSessions: currentSessions,
            PreviousSessions: previousSessions,
            PercentChange: percentChange,
            ActiveNow: activeNow,
            InSwedenNow: inSwedenNow,
            PeakHour: peakHour,
            AverageHourlySessions: averageHourlySessions,
            TopAirlines: topAirlines,
            BusiestDay: busiestDay,
            TrendPattern: trendPattern,
            Caveats:
            [
                "Airline codes are inferred from callsign prefixes.",
                "Data represents observed OpenSky sessions in the tracked region, not complete gate-to-gate flights."
            ]);
    }

    private static object ToPromptPayload(TrafficBriefFacts facts)
    {
        return new
        {
            window = new
            {
                currentHours = 24,
                facts.CurrentSessions,
                facts.PreviousSessions,
                facts.PercentChange
            },
            live = new
            {
                facts.ActiveNow,
                facts.InSwedenNow
            },
            peakHour = facts.PeakHour is null
                ? null
                : new
                {
                    timeStockholm = $"{ToStockholmHour(facts.PeakHour.StartUtc):00}:00",
                    sessions = facts.PeakHour.SessionCount,
                    averageHourlySessions = facts.AverageHourlySessions
                },
            topAirlines = facts.TopAirlines.Select(x => new
            {
                code = x.Code,
                sessions = x.SessionCount
            }),
            busiestDay = facts.BusiestDay is null
                ? null
                : new
                {
                    facts.BusiestDay.DayName,
                    date = facts.BusiestDay.Date.ToString("yyyy-MM-dd"),
                    facts.BusiestDay.Sessions
                },
            facts.TrendPattern,
            caveats = facts.Caveats
        };
    }

    private async Task<IReadOnlyList<HourlyBucket>> GetHourlyBucketsAsync(
        DateTime fromUtc,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var seenTimes = await _db.FlightSessions
            .AsNoTracking()
            .Where(s => s.LastSeenUtc >= fromUtc)
            .Select(s => s.LastSeenUtc)
            .ToListAsync(cancellationToken);

        var endHourUtc = new DateTime(
            utcNow.Year,
            utcNow.Month,
            utcNow.Day,
            utcNow.Hour,
            0,
            0,
            DateTimeKind.Utc);

        var counts = seenTimes
            .GroupBy(t => new DateTime(
                t.Year,
                t.Month,
                t.Day,
                t.Hour,
                0,
                0,
                DateTimeKind.Utc))
            .ToDictionary(g => g.Key, g => g.Count());

        var buckets = new List<HourlyBucket>(24);

        for (var i = 23; i >= 0; i--)
        {
            var startUtc = endHourUtc.AddHours(-i);
            buckets.Add(new HourlyBucket(
                startUtc,
                counts.TryGetValue(startUtc, out var count) ? count : 0));
        }

        return buckets;
    }

    private static PeakHour? GetPeakHour(IReadOnlyList<HourlyBucket> buckets)
    {
        var top = buckets
            .OrderByDescending(x => x.SessionCount)
            .FirstOrDefault();

        return top is null
            ? null
            : new PeakHour(top.StartUtc, top.SessionCount);
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

    private async Task<BusiestDay?> GetBusiestDayAsync(
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);

        BusiestDay? busiestDay = null;

        for (var i = 6; i >= 0; i--)
        {
            var localDate = nowLocal.Date.AddDays(-i);

            var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(localDate, tz);
            var dayEndUtc = TimeZoneInfo.ConvertTimeToUtc(localDate.AddDays(1), tz);

            var sessions = await _db.FlightSessions
                .AsNoTracking()
                .CountAsync(
                    s => s.LastSeenUtc >= dayStartUtc &&
                         s.LastSeenUtc < dayEndUtc,
                    cancellationToken);

            var dayName = localDate.ToString("dddd", System.Globalization.CultureInfo.InvariantCulture);
            var date = DateOnly.FromDateTime(localDate);

            if (busiestDay is null || sessions > busiestDay.Sessions)
            {
                busiestDay = new BusiestDay(dayName, date, sessions);
            }
        }

        return busiestDay;
    }

    private static string GetTrendPattern(IReadOnlyList<HourlyBucket> buckets)
    {
        var morning = buckets
            .Where(x => ToStockholmHour(x.StartUtc) is >= 6 and < 12)
            .Sum(x => x.SessionCount);

        var midday = buckets
            .Where(x => ToStockholmHour(x.StartUtc) is >= 12 and < 17)
            .Sum(x => x.SessionCount);

        var evening = buckets
            .Where(x => ToStockholmHour(x.StartUtc) is >= 17 and < 22)
            .Sum(x => x.SessionCount);

        var max = Math.Max(morning, Math.Max(midday, evening));
        var total = buckets.Sum(x => x.SessionCount);

        if (total == 0)
            return "no clear activity pattern";

        if (max < total * 0.4)
            return "fairly even distribution";

        if (max == morning)
            return "morning-heavy activity";

        if (max == midday)
            return "midday concentration";

        return "evening-heavy activity";
    }

    private static int ToStockholmHour(DateTime utc)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
        return TimeZoneInfo.ConvertTimeFromUtc(utc, tz).Hour;
    }

    private static AiTrafficBriefResponseDto BuildFallbackResponse(
        TrafficBriefFacts facts,
        DateTime generatedAtUtc)
    {
        var bullets = new List<string>
        {
            BuildSessionComparisonBullet(facts),
            $"There are {facts.ActiveNow} active sessions now, including {facts.InSwedenNow} currently inside Sweden."
        };

        if (facts.PeakHour is not null)
        {
            var stockholmHour = ToStockholmHour(facts.PeakHour.StartUtc);

            bullets.Add(
                $"Activity peaked around {stockholmHour:00}:00 with {facts.PeakHour.SessionCount} sessions, compared with a {facts.AverageHourlySessions:0.0} hourly average.");
        }

        if (facts.TopAirlines.Count > 0)
        {
            bullets.Add(BuildTopAirlinesBullet(facts.TopAirlines));
        }

        if (facts.BusiestDay is not null)
        {
            bullets.Add(
                $"{facts.BusiestDay.DayName} was the busiest day in the last week with {facts.BusiestDay.Sessions} sessions.");
        }

        bullets.Add($"The overall activity pattern shows {facts.TrendPattern}.");

        return new AiTrafficBriefResponseDto
        {
            Headline = BuildHeadline(facts.PercentChange),
            Bullets = bullets,
            Confidence = facts.CurrentSessions < 10 ? "low" : "medium",
            Caveats = facts.Caveats,
            GeneratedAtUtc = generatedAtUtc,
            Source = "fallback"
        };
    }

    private static string BuildSessionComparisonBullet(TrafficBriefFacts facts)
    {
        if (facts.PercentChange is null)
        {
            return $"Observed {facts.CurrentSessions} sessions in the last 24 hours. No previous-period comparison is available yet.";
        }

        var direction = facts.PercentChange >= 0 ? "up" : "down";

        return
            $"Observed {facts.CurrentSessions} sessions in the last 24 hours, {direction} {Math.Abs(facts.PercentChange.Value)}% from {facts.PreviousSessions} in the previous 24-hour window.";
    }

    private static string BuildTopAirlinesBullet(IReadOnlyList<TopAirline> topAirlines)
    {
        if (topAirlines.Count == 1)
        {
            var top = topAirlines[0];
            return $"Top observed airline code was {top.Code} with {top.SessionCount} sessions.";
        }

        var leader = topAirlines[0];
        var followers = string.Join(" and ", topAirlines.Skip(1).Select(x => x.Code));

        return
            $"{leader.Code} led observed airline codes with {leader.SessionCount} sessions, followed by {followers}.";
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

    private static string NormalizeConfidence(string? confidence)
    {
        return confidence?.Trim().ToLowerInvariant() switch
        {
            "low" => "low",
            "high" => "high",
            _ => "medium"
        };
    }

    private sealed record TrafficBriefFacts(
        int CurrentSessions,
        int PreviousSessions,
        decimal? PercentChange,
        int ActiveNow,
        int InSwedenNow,
        PeakHour? PeakHour,
        double AverageHourlySessions,
        IReadOnlyList<TopAirline> TopAirlines,
        BusiestDay? BusiestDay,
        string TrendPattern,
        IReadOnlyList<string> Caveats);

    private sealed record HourlyBucket(DateTime StartUtc, int SessionCount);

    private sealed record PeakHour(DateTime StartUtc, int SessionCount);

    private sealed record TopAirline(string Code, int SessionCount);

    private sealed record BusiestDay(string DayName, DateOnly Date, int Sessions);

    private sealed class OpenAiChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenAiChoice> Choices { get; set; } = [];
    }

    private sealed class OpenAiChoice
    {
        [JsonPropertyName("message")]
        public OpenAiMessage? Message { get; set; }
    }

    private sealed class OpenAiMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    private sealed class AiBriefModelResponse
    {
        public string Headline { get; set; } = "";
        public List<string> Bullets { get; set; } = [];
        public string Confidence { get; set; } = "medium";
        public List<string> Caveats { get; set; } = [];
    }
}