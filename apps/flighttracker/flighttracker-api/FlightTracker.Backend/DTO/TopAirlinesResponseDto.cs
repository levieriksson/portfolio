namespace FlightTracker.Backend.DTO;

public sealed record TopAirlinesResponseDto(
    string Range,
    IReadOnlyList<TopAirlineItemDto> Items
);

public sealed record TopAirlineItemDto(
    string AirlineCode,
    int SessionCount
);