namespace FlightTracker.Backend.DTO;

public sealed record TrailPoint(
    DateTime TimestampUtc,
    double Lat,
    double Lon,
    double? Alt,
    double? Vel,
    double? Trk);

public sealed record TrailResponse(
    int SessionId,
    DateTime? FromUtc,
    DateTime? ToUtc,
    int Count,
    IReadOnlyList<TrailPoint> Points);
