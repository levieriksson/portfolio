using System;
using FlightTracker.Backend.Models;
using Microsoft.EntityFrameworkCore;
namespace FlightTracker.Backend.Data;

public class FlightDbContext : DbContext
{
    public FlightDbContext(DbContextOptions<FlightDbContext> options) : base(options) { }

    public DbSet<AircraftSnapshot> AircraftSnapshots { get; set; } = null!;
    public DbSet<FlightSession> FlightSessions { get; set; } = null!;
}
