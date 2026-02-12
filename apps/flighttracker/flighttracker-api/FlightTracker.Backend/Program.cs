using FlightTracker.Backend.Infrastructure.Json;
using FlightTracker.Backend.Services;
using FlightTracker.Data;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);


builder.Logging.ClearProviders();
builder.Logging.AddConsole();


if (OperatingSystem.IsWindows())
{
    builder.Host.UseWindowsService();
    builder.Logging.AddEventLog();
}


builder.Services.AddControllers();


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddOptions<OpenSkyOptions>()
    .Configure(o =>
    {

        o.Username = (builder.Configuration["OPENSKY_USERNAME"] ?? "").Trim();
        o.Password = (builder.Configuration["OPENSKY_PASSWORD"] ?? "").Trim();
    })
    .ValidateDataAnnotations()
    .Validate(o => o.SessionRetentionDays >= o.SnapshotRetentionDays,
        "SessionRetentionDays must be >= SnapshotRetentionDays to avoid FK issues.")
    .ValidateOnStart();



var dbProvider = (builder.Configuration["Database:Provider"] ?? "postgres").Trim().ToLowerInvariant();


var connectionString = builder.Configuration.GetConnectionString("FlightDb");

if (string.IsNullOrWhiteSpace(connectionString))
{
    if (dbProvider == "sqlite")
    {

        var dataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "FlightTracker");
        Directory.CreateDirectory(dataDir);

        var dbPath = Path.Combine(dataDir, "flights.db");
        connectionString = $"Data Source={dbPath}";
    }
    else
    {
        throw new InvalidOperationException(
            "Missing ConnectionStrings:FlightDb (set ConnectionStrings__FlightDb in Azure).");
    }
}

builder.Services.AddDbContext<FlightDbContext>(options =>
{
    if (dbProvider == "sqlite")
        options.UseSqlite(connectionString, x => x.MigrationsAssembly("FlightTracker.Data"));
    else
        options.UseNpgsql(connectionString, x => x.MigrationsAssembly("FlightTracker.Data"));
});


builder.Services.AddHttpClient("opensky");

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new AssumeUtcDateTimeConverter());
});


builder.Services.AddSingleton<OpenSkyAuthService>();
builder.Services.AddSingleton<OpenSkyIngestionRunner>();
builder.Services.AddScoped<AircraftCsvImporter>();

if (builder.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("Features:AutoMigrate"))
{
    builder.Services.AddHostedService<DbMigrationHostedService>();
}



var enableIngestion = builder.Configuration.GetValue<bool>("Features:EnableIngestionHostedServices");
if (enableIngestion)
{

    builder.Services.AddHostedService<AircraftImportHostedService>();
    builder.Services.AddHostedService<OpenSkyIngestionService>();
}


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


var enableSwagger = app.Environment.IsDevelopment()
                   || builder.Configuration.GetValue<bool>("Features:EnableSwagger");

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "FlightTracker API v1");
        c.RoutePrefix = "swagger";
    });
}

app.MapControllers();

app.Run();
