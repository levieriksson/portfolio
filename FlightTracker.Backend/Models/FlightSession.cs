using System;

namespace FlightTracker.Backend.Models;

public class FlightSession
{
    public int Id { get; set; }

    public string Icao24 { get; set; } = null!;
    public string? Callsign { get; set; }

    public DateTime FirstSeenUtc { get; set; }
    public DateTime LastSeenUtc { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime? EndUtc { get; set; }
    public string? CloseReason { get; set; }

    public int SnapshotCount { get; set; }

    public double? MaxAltitude { get; set; }
    public double? AvgAltitude { get; set; }

    // Sweden presence tracking
    public DateTime? EnteredSwedenUtc { get; set; }
    public DateTime? ExitedSwedenUtc { get; set; }

    public List<AircraftSnapshot> Snapshots { get; set; } = new();
}
