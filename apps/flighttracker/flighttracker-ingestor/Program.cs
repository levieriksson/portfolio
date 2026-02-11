using FlightTracker.Backend.Infrastructure.Json;
using FlightTracker.Backend.Services;
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
        config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
        config.AddEnvironmentVariables();
    })
    .ConfigureServices((ctx, services) =>
    {

        var sqliteRel = ctx.Configuration["Database:SqlitePath"];
        if (string.IsNullOrWhiteSpace(sqliteRel))
            throw new InvalidOperationException("Missing Database:SqlitePath in appsettings.json");

        var repoRoot = Directory.GetCurrentDirectory();
        var sqliteAbs = Path.GetFullPath(Path.Combine(repoRoot, sqliteRel));
        Console.WriteLine($"[INGESTOR] SQLite = {sqliteAbs}");

        var dir = Path.GetDirectoryName(sqliteAbs);
        if (!string.IsNullOrWhiteSpace(dir))
            Directory.CreateDirectory(dir);

        var cs = $"Data Source={sqliteAbs}";

        services.AddDbContext<FlightDbContext>(options =>
            options.UseSqlite(cs, x => x.MigrationsAssembly("FlightTracker.Data")));


        services.AddOptions<OpenSkyOptions>()
            .Bind(ctx.Configuration.GetSection("OpenSky"))
            .ValidateDataAnnotations()
            .Validate(o => !string.IsNullOrWhiteSpace(o.Username) && !string.IsNullOrWhiteSpace(o.Password),
                "Missing OpenSky:Username/OpenSky:Password (or env vars).")
            .Validate(o => o.SessionRetentionDays >= o.SnapshotRetentionDays,
                "SessionRetentionDays must be >= SnapshotRetentionDays.")
            .ValidateOnStart();


        services.PostConfigure<OpenSkyOptions>(o =>
        {
            var u = (ctx.Configuration["OPENSKY_USERNAME"] ?? "").Trim();
            var p = (ctx.Configuration["OPENSKY_PASSWORD"] ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(u)) o.Username = u;
            if (!string.IsNullOrWhiteSpace(p)) o.Password = p;
        });

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
