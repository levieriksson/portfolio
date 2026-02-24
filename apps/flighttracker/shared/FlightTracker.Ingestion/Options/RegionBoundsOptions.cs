using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Ingestion.Options;

public sealed class RegionBoundsOptions
{
    [Range(-90, 90)] public double LatMin { get; set; } = 54.5;
    [Range(-90, 90)] public double LatMax { get; set; } = 70.5;
    [Range(-180, 180)] public double LonMin { get; set; } = 10.0;
    [Range(-180, 180)] public double LonMax { get; set; } = 26.5;
}