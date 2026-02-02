using FlightTracker.Backend.Data;
using FlightTracker.Backend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// Register DbContext and ingestion service BEFORE Build()
builder.Services.AddDbContext<FlightDbContext>(options =>
    options.UseSqlite("Data Source=flights.db"));

builder.Services.AddHostedService<OpenSkyIngestionService>();

var app = builder.Build();

// Optional: HTTPS redirection
app.UseHttpsRedirection();

// Root endpoint
app.MapGet("/", () => "Flight Tracker backend is running!");

// Endpoint to return all snapshots in DB
app.MapGet("/snapshots", async (FlightDbContext db) =>
{
    var snapshots = await db.AircraftSnapshots.ToListAsync();
    return Results.Json(snapshots);
});

app.Run();
