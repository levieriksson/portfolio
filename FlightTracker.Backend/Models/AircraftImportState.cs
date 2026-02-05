using System.ComponentModel.DataAnnotations;

namespace FlightTracker.Backend.Models;

public class AircraftImportState
{
    [Key]
    public int Id { get; set; } = 1;

    public DateTime? LastImportedUtc { get; set; }

    [MaxLength(260)]
    public string? SourcePath { get; set; }

    public DateTime? SourceLastWriteUtc { get; set; }

    public long? ImportedRows { get; set; }
}
