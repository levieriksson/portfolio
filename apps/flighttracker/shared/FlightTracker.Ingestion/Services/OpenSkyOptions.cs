using System;
using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Ingestion.Services;


public sealed class OpenSkyOptions
{
    [Required]
    public string Username { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";

    public string TokenUrl { get; set; } =
        "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

    public string StatesUrl { get; set; } =
        "https://opensky-network.org/api/states/all";


    public double LatMin { get; set; } = 55.1331;
    public double LatMax { get; set; } = 69.0599;
    public double LonMin { get; set; } = 10.5931;
    public double LonMax { get; set; } = 24.1777;


    [Range(10, 3600)]
    public int IntervalSeconds { get; set; } = 120;


    [Range(60, 24 * 3600)]
    public int SessionGapSeconds { get; set; } = 2 * 3600;

    [Range(1, 365)]
    public int SnapshotRetentionDays { get; set; } = 14;

    [Range(7, 3650)]
    public int SessionRetentionDays { get; set; } = 180;

    [Range(1, 72)]
    public int CleanupEveryHours { get; set; } = 6;
}
