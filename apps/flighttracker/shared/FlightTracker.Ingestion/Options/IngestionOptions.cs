using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Ingestion.Options;

public sealed class IngestionOptions
{
    [Range(60, 24 * 3600)]
    public int SessionGapSeconds { get; set; } = 1500;

    [Range(1, 365)]
    public int SnapshotRetentionDays { get; set; } = 14;

    [Range(7, 3650)]
    public int SessionRetentionDays { get; set; } = 180;

    [Range(1, 72)]
    public int CleanupEveryHours { get; set; } = 6;

    [Range(1, 100000)]
    public int MaxAltitudeM { get; set; } = 20000;

    [Range(0.1, 5000)]
    public double MaxVelocityMps { get; set; } = 400;
}