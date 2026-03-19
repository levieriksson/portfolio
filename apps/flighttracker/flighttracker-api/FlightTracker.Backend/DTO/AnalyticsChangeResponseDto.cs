namespace FlightTracker.Backend.DTO;

public sealed record AnalyticsChangeResponseDto(
    int CurrentSessions,
    int PreviousSessions,
    decimal? PercentChange
);