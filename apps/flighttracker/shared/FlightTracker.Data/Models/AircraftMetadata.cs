using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Data.Models;

public class AircraftMetadata
{
    [Key]
    [MaxLength(6)]
    public string Icao24 { get; set; } = default!;

    public long Timestamp { get; set; }

    [MaxLength(16)]
    public string? TypeCode { get; set; }

    [MaxLength(128)]
    public string? ManufacturerName { get; set; }

    [MaxLength(128)]
    public string? Model { get; set; }

    [MaxLength(32)]
    public string? Registration { get; set; }

    [MaxLength(16)]
    public string? OperatorIcao { get; set; }

    [MaxLength(128)]
    public string? OperatorName { get; set; }

    [MaxLength(64)]
    public string? Country { get; set; }

    [MaxLength(128)]
    public string? CategoryDescription { get; set; }

    public DateTime UpdatedUtc { get; set; }
}
