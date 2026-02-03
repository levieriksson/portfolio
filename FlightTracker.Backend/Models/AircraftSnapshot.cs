using System;

namespace FlightTracker.Backend.Models;

public class AircraftSnapshot
{
    public int Id { get; set; }

    public string Icao24 { get; set; } = null!;
    public string? Callsign { get; set; }
    public string OriginCountry { get; set; } = null!;

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? Altitude { get; set; }
    public double? Velocity { get; set; }

    public DateTime TimestampUtc { get; set; }

    public int? FlightSessionId { get; set; }
    public FlightSession? FlightSession { get; set; }

    public bool InSweden { get; set; }
}
