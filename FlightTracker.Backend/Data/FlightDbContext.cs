using System;
using FlightTracker.Backend.Models;
using Microsoft.EntityFrameworkCore;
namespace FlightTracker.Backend.Data;

public class FlightDbContext : DbContext
{
    public FlightDbContext(DbContextOptions<FlightDbContext> options) : base(options) { }

    public DbSet<AircraftSnapshot> AircraftSnapshots { get; set; } = null!;
    public DbSet<FlightSession> FlightSessions { get; set; } = null!;

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

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => s.FlightSessionId);

        modelBuilder.Entity<AircraftSnapshot>()
            .HasIndex(s => new { s.Icao24, s.TimestampUtc });

        base.OnModelCreating(modelBuilder);
    }
}