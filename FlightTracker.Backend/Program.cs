using FlightTracker.Backend.Data;
using FlightTracker.Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);


builder.Host.UseWindowsService();
builder.Logging.ClearProviders();
builder.Logging.AddEventLog();
builder.Logging.AddConsole();

builder.Services.AddOptions<OpenSkyOptions>()
    .Configure(o =>
    {
        o.Username = (builder.Configuration["OPENSKY_USERNAME"] ?? "").Trim();
        o.Password = (builder.Configuration["OPENSKY_PASSWORD"] ?? "").Trim();
    })
    .ValidateDataAnnotations()
    .Validate(o => !string.IsNullOrWhiteSpace(o.Username) && !string.IsNullOrWhiteSpace(o.Password),
        "Missing OPENSKY_USERNAME/OPENSKY_PASSWORD environment variables.")
    .ValidateOnStart();

var dataDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "FlightTracker");
Directory.CreateDirectory(dataDir);

var dbPath = Path.Combine(dataDir, "flights.db");

builder.Services.AddDbContext<FlightDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));


builder.Services.AddHttpClient("opensky");


builder.Services.AddSingleton<OpenSkyAuthService>();
builder.Services.AddHostedService<DbMigrationHostedService>();
builder.Services.AddHostedService<OpenSkyIngestionService>();

var app = builder.Build();


app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/stats/today", async (FlightDbContext db) =>
{

    var start = DateTime.UtcNow.Date;
    var end = start.AddDays(1);

    var flightsToday = await db.FlightSessions.CountAsync(s =>
        s.EnteredSwedenUtc != null &&
        s.EnteredSwedenUtc >= start && s.EnteredSwedenUtc < end);

    var activeNow = await db.FlightSessions.CountAsync(s =>
        s.IsActive && s.EnteredSwedenUtc != null);

    return Results.Ok(new
    {
        flightsTodayInSweden = flightsToday,
        activeFlightsInSweden = activeNow,
        dbPath
    });
});

app.MapGet("/api/flights", async (string date, FlightDbContext db) =>
{

    if (!DateTime.TryParse(date, out var parsed))
        return Results.BadRequest("Invalid date. Use YYYY-MM-DD.");

    var dayStart = DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
    var dayEnd = dayStart.AddDays(1);

    var sessions = await db.FlightSessions
        .Where(s => s.EnteredSwedenUtc != null &&
                    s.EnteredSwedenUtc >= dayStart &&
                    s.EnteredSwedenUtc < dayEnd)
        .OrderByDescending(s => s.FirstSeenUtc)
        .Select(s => new
        {
            s.Id,
            s.Icao24,
            s.Callsign,
            s.FirstSeenUtc,
            s.LastSeenUtc,
            s.EndUtc,
            s.IsActive,
            s.SnapshotCount,
            s.MaxAltitude
        })
        .ToListAsync();

    return Results.Ok(sessions);
});



app.MapGet("/api/flights/{id:int}", async (int id, FlightDbContext db) =>
{
    var session = await db.FlightSessions
        .Include(s => s.Snapshots)
        .FirstOrDefaultAsync(s => s.Id == id);

    return session is null ? Results.NotFound() : Results.Ok(session);
});

app.MapGet("/api/debug/ingestion", async (FlightDbContext db) =>
{
    var lastSnap = await db.AircraftSnapshots
        .OrderByDescending(s => s.TimestampUtc)
        .Select(s => s.TimestampUtc)
        .FirstOrDefaultAsync();

    var snapCount = await db.AircraftSnapshots.CountAsync();
    var sessionCount = await db.FlightSessions.CountAsync();

    return Results.Ok(new { lastSnapshotUtc = lastSnap, snapshots = snapCount, sessions = sessionCount });
});

app.Run();
