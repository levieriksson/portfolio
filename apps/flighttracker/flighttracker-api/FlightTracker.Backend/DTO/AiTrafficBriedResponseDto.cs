namespace FlightTracker.Backend.DTO;

public sealed class AiTrafficBriefResponseDto
{
    public required string Headline { get; init; }
    public required IReadOnlyList<string> Bullets { get; init; }
    public required string Confidence { get; init; }
    public required IReadOnlyList<string> Caveats { get; init; }
    public required DateTime GeneratedAtUtc { get; init; }
    public required string Source { get; init; }
}