using FlightTracker.Backend.Data;
using FlightTracker.Backend.Infrastructure.Json;
using FlightTracker.Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Globalization;

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
builder.Services.AddScoped<AircraftCsvImporter>();
builder.Services.AddHostedService<AircraftImportHostedService>();
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new AssumeUtcDateTimeConverter());
});
builder.Services.AddSingleton<OpenSkyAuthService>();
builder.Services.AddHostedService<DbMigrationHostedService>();
builder.Services.AddHostedService<OpenSkyIngestionService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://levieriksson.dev",
                "https://www.levieriksson.dev"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("frontend");

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/stats/today", async (FlightDbContext db) =>
{
    var start = DateTime.UtcNow.Date;
    var end = start.AddDays(1);

    var flightsToday = await db.FlightSessions.CountAsync(s =>
        s.EnteredSwedenUtc != null &&
        s.EnteredSwedenUtc >= start && s.EnteredSwedenUtc < end);

    const int activeCutoffMinutes = 25;
    var cutoff = DateTime.UtcNow.AddMinutes(-activeCutoffMinutes);

    var activeNow = await db.FlightSessions.CountAsync(s =>
        s.IsActive &&
        s.EnteredSwedenUtc != null &&
        s.LastSeenUtc >= cutoff);

    return Results.Ok(new
    {
        activeNowCutoffMinutes = activeCutoffMinutes,
        flightsTodayInSweden = flightsToday,
        activeFlightsInSweden = activeNow,
        dbPath
    });
});

/// Details: include aircraft metadata (typecode/model/operator/etc.)
app.MapGet("/api/flights/{id:int}", async (int id, FlightDbContext db) =>
{
    var session = await db.FlightSessions
        .AsNoTracking()
        .Where(s => s.Id == id)
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
            s.MaxAltitude,
            s.AvgAltitude,
            s.EnteredSwedenUtc,
            s.ExitedSwedenUtc,
            s.CloseReason,

            aircraft = db.AircraftMetadata
                .Where(a => a.Icao24 == s.Icao24)
                .Select(a => new
                {
                    a.TypeCode,
                    a.ManufacturerName,
                    a.Model,
                    a.Registration,
                    a.OperatorIcao,
                    a.OperatorName,
                    a.Country,
                    a.CategoryDescription
                })
                .FirstOrDefault(),

            snapshots = s.Snapshots
                .OrderBy(x => x.TimestampUtc)
                .Select(x => new
                {
                    x.Id,
                    x.TimestampUtc,
                    x.Latitude,
                    x.Longitude,
                    x.Altitude,
                    x.Velocity,
                    x.Callsign,
                    x.OriginCountry
                })
                .ToList()
        })
        .FirstOrDefaultAsync();

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

/// Optional: quick verification that metadata exists + last import state
app.MapGet("/api/debug/aircraft-import", async (FlightDbContext db) =>
{
    var aircraftRows = await db.AircraftMetadata.CountAsync();
    var state = await db.AircraftImportStates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1);
    return Results.Ok(new { aircraftRows, state });
});

app.MapGet("/api/stats/overview", async (FlightDbContext db) =>
{
    var utcNow = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
    var start = utcNow.Date;
    var end = start.AddDays(1);

    var flightsToday = await db.FlightSessions.CountAsync(s =>
        s.EnteredSwedenUtc != null &&
        s.EnteredSwedenUtc >= start && s.EnteredSwedenUtc < end);

    const int activeCutoffMinutes = 25;
    var cutoff = utcNow.AddMinutes(-activeCutoffMinutes);

    var activeNow = await db.FlightSessions.CountAsync(s =>
        s.IsActive &&
        s.EnteredSwedenUtc != null &&
        s.LastSeenUtc >= cutoff);

    var lastSnapRaw = await db.AircraftSnapshots
        .OrderByDescending(s => s.TimestampUtc)
        .Select(s => s.TimestampUtc)
        .FirstOrDefaultAsync();

    DateTime? lastSnapUtc =
        lastSnapRaw == default
            ? null
            : DateTime.SpecifyKind(lastSnapRaw, DateTimeKind.Utc);

    var snapCount = await db.AircraftSnapshots.CountAsync();
    var sessionCount = await db.FlightSessions.CountAsync();

    return Results.Ok(new
    {
        activeNowCutoffMinutes = activeCutoffMinutes,
        utcNow,
        flightsTodayInSweden = flightsToday,
        activeFlightsInSweden = activeNow,
        lastSnapshotUtc = lastSnapUtc,
        snapshots = snapCount,
        sessions = sessionCount
    });
});

/// List: include lightweight aircraft metadata (typecode/operator/model)
app.MapGet("/api/flights", async (
    string date,
    int page,
    int pageSize,
    bool? activeOnly,
    string? q,
    string? sort,
    FlightDbContext db) =>
{
    if (!DateTime.TryParseExact(
            date,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var parsed))
    {
        return Results.BadRequest("Invalid date. Use YYYY-MM-DD.");
    }

    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    if (pageSize > 200) pageSize = 200;

    var dayStart = DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
    var dayEnd = dayStart.AddDays(1);

    var utcNow = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

    const int activeCutoffMinutes = 25;
    var cutoff = utcNow.AddMinutes(-activeCutoffMinutes);

    var query = db.FlightSessions
        .AsNoTracking()
        .Where(s =>
            s.EnteredSwedenUtc != null &&
            s.EnteredSwedenUtc >= dayStart &&
            s.EnteredSwedenUtc < dayEnd);

    if (!string.IsNullOrWhiteSpace(q))
    {
        var term = q.Trim();

        query = query.Where(s =>
            (s.Callsign != null &&
             EF.Functions.Like(EF.Functions.Collate(s.Callsign, "NOCASE"), $"%{term}%")) ||
            EF.Functions.Like(EF.Functions.Collate(s.Icao24, "NOCASE"), $"%{term}%"));
    }

    if (activeOnly == true)
    {
        query = query.Where(s => s.IsActive && s.LastSeenUtc >= cutoff);
    }

    query = (sort ?? "lastSeenDesc") switch
    {
        "firstSeenAsc" => query.OrderBy(s => s.FirstSeenUtc),
        "firstSeenDesc" => query.OrderByDescending(s => s.FirstSeenUtc),
        "lastSeenAsc" => query.OrderBy(s => s.LastSeenUtc),
        _ => query.OrderByDescending(s => s.LastSeenUtc),
    };

    var total = await query.CountAsync();

    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
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
            s.MaxAltitude,

            aircraft = db.AircraftMetadata
                .Where(a => a.Icao24 == s.Icao24)
                .Select(a => new
                {
                    a.TypeCode,
                    a.OperatorName,
                    a.Model
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    return Results.Ok(new
    {
        date = parsed.Date.ToString("yyyy-MM-dd"),
        page,
        pageSize,
        total,
        activeNowCutoffMinutes = activeCutoffMinutes,
        items
    });
});

app.Run();
