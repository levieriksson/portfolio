using FlightTracker.Backend.Options;
using FlightTracker.Backend.Services;
using FlightTracker.Data;
using FlightTracker.Ingestion.Helpers;
using FlightTracker.Ingestion.Services;
using Microsoft.AspNetCore.Http.Json;
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

builder.Services.Configure<MapBoundsOptions>(
    builder.Configuration.GetSection("MapBounds"));

var enableIngestion = builder.Configuration.GetValue<bool>("Features:EnableIngestionHostedServices");

var openSky = builder.Services.AddOptions<OpenSkyOptions>()
    .Bind(builder.Configuration.GetSection("OpenSky"))
    .Configure(o =>
    {
        var u = (builder.Configuration["OPENSKY_USERNAME"] ?? "").Trim();
        var p = (builder.Configuration["OPENSKY_PASSWORD"] ?? "").Trim();

        if (!string.IsNullOrWhiteSpace(u)) o.Username = u;
        if (!string.IsNullOrWhiteSpace(p)) o.Password = p;
    })
    .Validate(o => o.SessionRetentionDays >= o.SnapshotRetentionDays,
        "SessionRetentionDays must be >= SnapshotRetentionDays to avoid FK issues.");

if (enableIngestion)
{
    openSky
        .ValidateDataAnnotations()
        .Validate(o => !string.IsNullOrWhiteSpace(o.Username) && !string.IsNullOrWhiteSpace(o.Password),
            "Missing OpenSky credentials. Set OPENSKY_USERNAME / OPENSKY_PASSWORD.");
}

if (enableIngestion && !builder.Environment.IsDevelopment())
{
    openSky.ValidateOnStart();
}

var connectionString = ResolveFlightDbConnectionString(builder.Configuration);
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Missing FlightDb connection string. Set ConnectionStrings__FlightDb (App Settings) or POSTGRESQLCONNSTR_FlightDb/CUSTOMCONNSTR_FlightDb (Azure Connection Strings).");
}

builder.Services.AddDbContext<FlightDbContext>(options =>
    options.UseNpgsql(connectionString, x => x.MigrationsAssembly("FlightTracker.Data")));

builder.Services.AddHttpClient("opensky");

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new AssumeUtcDateTimeConverter());
});

builder.Services.AddSingleton<OpenSkyAuthService>();
builder.Services.AddSingleton<OpenSkyIngestionRunner>();



if (builder.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("Features:AutoMigrate"))
{
    builder.Services.AddHostedService<DbMigrationHostedService>();
}

if (enableIngestion)
{

    builder.Services.AddHostedService<OpenSkyIngestionService>();
}

builder.Services.AddCors(options =>
{
    var fixedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "http://localhost:3000",
        "https://levieriksson.dev",
        "https://www.levieriksson.dev",
    };

    static bool IsAllowedVercelPreview(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin)) return false;

        return origin.StartsWith("https://portfolio-", StringComparison.OrdinalIgnoreCase)
            && origin.EndsWith("-levi-erikssons-projects.vercel.app", StringComparison.OrdinalIgnoreCase);
    }

    options.AddPolicy("frontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
                fixedOrigins.Contains(origin) || IsAllowedVercelPreview(origin))
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

static string? ResolveFlightDbConnectionString(IConfiguration configuration)
{
    var direct = configuration.GetConnectionString("FlightDb");
    if (!string.IsNullOrWhiteSpace(direct)) return direct;

    var azurePostgres = configuration["POSTGRESQLCONNSTR_FlightDb"];
    if (!string.IsNullOrWhiteSpace(azurePostgres)) return azurePostgres;

    var azureCustom = configuration["CUSTOMCONNSTR_FlightDb"];
    if (!string.IsNullOrWhiteSpace(azureCustom)) return azureCustom;

    return null;
}
