using System;
using Microsoft.EntityFrameworkCore;
using FlightTracker.Backend.Data;

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

            await db.Database.MigrateAsync(cancellationToken);
            _logger.LogInformation("Database migrated/ready.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database migration failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}