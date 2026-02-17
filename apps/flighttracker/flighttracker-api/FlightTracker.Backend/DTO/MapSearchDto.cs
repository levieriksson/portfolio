namespace FlightTracker.Backend.DTO;

public sealed record MapSearchResponse(
    int Limit,
    IReadOnlyList<MapSearchItem> Items
);

public sealed record MapSearchItem(
    int SessionId,
    string Icao24,
    string? Callsign,
    DateTime LastSeenUtc,
    AircraftInfoLite? Aircraft
);