using FlightTracker.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Data;

public class FlightDbContext : DbContext
{
    public FlightDbContext(DbContextOptions<FlightDbContext> options) : base(options) { }

    public DbSet<AircraftSnapshot> AircraftSnapshots { get; set; } = null!;
    public DbSet<FlightSession> FlightSessions { get; set; } = null!;
    public DbSet<AircraftMetadata> AircraftMetadata { get; set; } = null!;
    public DbSet<AircraftImportState> AircraftImportStates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AircraftSnapshot>()
            .HasOne(s => s.FlightSession)
            .WithMany(fs => fs.Snapshots)
            .HasForeignKey(s => s.FlightSessionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<FlightSession>()
            .HasIndex(s => new { s.Icao24, s.IsActive });

        modelBuilder.Entity<FlightSession>()
            .HasIndex(s => s.EnteredSwedenUtc);

        modelBuilder.Entity<FlightSession>()
            .HasIndex(s => new { s.IsActive, s.LastSeenUtc });

        modelBuilder.Entity<FlightSession>()
            .HasIndex(s => s.FirstSeenUtc);

        modelBuilder.Entity<FlightSession>()
            .HasIndex(s => s.LastSnapshotUtc);

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => s.FlightSessionId);

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => new { s.Icao24, s.TimestampUtc });

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => s.TimestampUtc);

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => new { s.FlightSessionId, s.TimestampUtc });

        modelBuilder.Entity<AircraftMetadata>()
            .HasKey(a => a.Icao24);

        modelBuilder.Entity<AircraftMetadata>()
            .HasIndex(a => a.TypeCode);

        modelBuilder.Entity<AircraftImportState>()
            .HasKey(x => x.Id);

        base.OnModelCreating(modelBuilder);
    }
}