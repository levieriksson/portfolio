using FlightTracker.Backend.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

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
            // This happens when the DB was created outside migrations (EnsureCreated, manual schema, etc.)
            // We keep the data and mark existing migrations as applied.
            _logger.LogWarning(ex, "Schema appears to already exist. Seeding EF migration history to match existing DB...");

            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();

            await SeedMigrationHistoryAsync(db, cancellationToken);

            _logger.LogInformation("EF migration history seeded. Continuing startup without deleting data.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database migration failed.");
            throw; // real migration failures should still fail fast
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static bool LooksLikeSchemaAlreadyExists(SqliteException ex)
        => ex.SqliteErrorCode == 1 && ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase);

    private static async Task SeedMigrationHistoryAsync(FlightDbContext db, CancellationToken ct)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync(ct);

        // Ensure the history table exists
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
                CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                    "ProductVersion" TEXT NOT NULL
                );
                """;
            await cmd.ExecuteNonQueryAsync(ct);
        }

        // Mark all known migrations in this assembly as applied (safe if you currently only have initial migration(s))
        var migrations = db.Database.GetMigrations().ToList();

        foreach (var id in migrations)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = """
                INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId","ProductVersion")
                VALUES ($id, $ver);
                toggle_select:
                """;
            cmd.Parameters.Add(new SqliteParameter("$id", id));
            cmd.Parameters.Add(new SqliteParameter("$ver", "10.0.2")); // matches your EF package version
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }
}
