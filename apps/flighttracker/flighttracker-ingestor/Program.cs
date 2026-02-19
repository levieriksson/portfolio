using FlightTracker.Ingestion.Helpers;
using FlightTracker.Ingestion.Services;
using FlightTracker.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((ctx, config) =>
    {
        config.SetBasePath(AppContext.BaseDirectory);
        config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);


        config.AddEnvironmentVariables();
    })
    .ConfigureServices((ctx, services) =>
    {
        var connectionString = ResolveFlightDbConnectionString(ctx.Configuration);
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "Missing FlightDb connection string. Set ConnectionStrings__FlightDb (App Settings) or POSTGRESQLCONNSTR_FlightDb/CUSTOMCONNSTR_FlightDb (Azure Connection Strings).");

        Console.WriteLine("[INGESTOR] Using PostgreSQL");

        services.AddDbContext<FlightDbContext>(options =>
            options.UseNpgsql(connectionString, x => x.MigrationsAssembly("FlightTracker.Data")));

        services.AddOptions<OpenSkyOptions>()
            .Bind(ctx.Configuration.GetSection("OpenSky"))
            .Configure(o =>
            {
                var u = (ctx.Configuration["OPENSKY_USERNAME"] ?? "").Trim();
                var p = (ctx.Configuration["OPENSKY_PASSWORD"] ?? "").Trim();

                if (!string.IsNullOrWhiteSpace(u)) o.Username = u;
                if (!string.IsNullOrWhiteSpace(p)) o.Password = p;
            })
            .ValidateDataAnnotations()
            .Validate(o => !string.IsNullOrWhiteSpace(o.Username) && !string.IsNullOrWhiteSpace(o.Password),
                "Missing OpenSky credentials. Set OPENSKY_USERNAME / OPENSKY_PASSWORD (recommended) or OpenSky:Username / OpenSky:Password.")
            .Validate(o => o.SessionRetentionDays >= o.SnapshotRetentionDays,
                "SessionRetentionDays must be >= SnapshotRetentionDays.")
            .Validate(o => !string.IsNullOrWhiteSpace(o.TokenUrl),
                "Missing OpenSky:TokenUrl (required for token auth).")
            .ValidateOnStart();

        services.AddHttpClient("opensky");

        services.ConfigureHttpJsonOptions(o =>
        {
            o.SerializerOptions.Converters.Add(new AssumeUtcDateTimeConverter());
        });

        services.AddSingleton<OpenSkyAuthService>();
        services.AddSingleton<OpenSkyIngestionRunner>();
    })
    .ConfigureLogging(logging =>
    {
        logging.ClearProviders();
        logging.AddConsole();
    })
    .Build();

using var scope = host.Services.CreateScope();
var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Ingestor");

try
{
    var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();
    await db.Database.MigrateAsync();

    var runner = scope.ServiceProvider.GetRequiredService<OpenSkyIngestionRunner>();
    await runner.RunOnceAsync(CancellationToken.None);

    logger.LogInformation("Ingestor run OK (migrated + ingested once).");
    return 0;
}
catch (Exception ex)
{
    logger.LogError(ex, "Ingestor run failed.");
    return 1;
}

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
