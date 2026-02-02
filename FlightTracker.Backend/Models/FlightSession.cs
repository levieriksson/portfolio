using System;

namespace FlightTracker.Backend.Models;

public class FlightSession
{
    public int Id { get; set; }
    public string Icao24 { get; set; } = null!;
    public string? Callsign { get; set; }
    public DateTime FirstSeenUtc { get; set; }
    public DateTime LastSeenUtc { get; set; }
    public double? MaxAltitude { get; set; }
    public double? AvgAltitude { get; set; }
    public bool IsActive { get; set; } = true;
}
