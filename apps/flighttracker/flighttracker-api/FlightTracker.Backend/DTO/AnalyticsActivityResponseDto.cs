namespace FlightTracker.Backend.DTO;

public sealed class AnalyticsActivityResponseDto
{
    public string Range { get; init; } = default!;
    public string Bucket { get; init; } = default!;
    public DateTime FromUtc { get; init; }
    public DateTime ToUtc { get; init; }

    public List<ActivityBucketDto> Buckets { get; init; } = new();
}

public sealed class ActivityBucketDto
{
    public DateTime StartUtc { get; init; }
    public int SessionsSeen { get; init; }
    public int EnteredSweden { get; init; }
}