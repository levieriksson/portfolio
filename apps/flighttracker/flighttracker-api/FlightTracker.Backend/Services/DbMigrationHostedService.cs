using FlightTracker.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FlightTracker.Backend.Services;

public sealed class DbMigrationHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<DbMigrationHostedService> _logger;

    public DbMigrationHostedService(IServiceProvider sp, ILogger<DbMigrationHostedService> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();

            _logger.LogInformation("Applying database migrations...");
            await db.Database.MigrateAsync(cancellationToken);
            _logger.LogInformation("Database migrations applied.");
        }
        catch (SqliteException ex) when (LooksLikeSchemaAlreadyExists(ex))
        {
            _logger.LogWarning(ex, "Schema appears to already exist. Seeding EF migration history...");

            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();

            await SeedMigrationHistoryAsync(db, cancellationToken);

            _logger.LogInformation("EF migration history seeded. Continuing startup without deleting data.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database migration failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static bool LooksLikeSchemaAlreadyExists(SqliteException ex)
        => ex.SqliteErrorCode == 1 &&
           ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase);

    private static async Task SeedMigrationHistoryAsync(FlightDbContext db, CancellationToken ct)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync(ct);


        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
                CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                    "ProductVersion" TEXT NOT NULL
                );
                """;
            await cmd.ExecuteNonQueryAsync(ct);
        }


        var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString() ?? "unknown";


        var migrations = db.Database.GetMigrations().ToList();

        foreach (var id in migrations)
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = """
                INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId","ProductVersion")
                VALUES ($id, $ver);
                """;
            cmd.Parameters.Add(new SqliteParameter("$id", id));
            cmd.Parameters.Add(new SqliteParameter("$ver", productVersion));
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }
}
