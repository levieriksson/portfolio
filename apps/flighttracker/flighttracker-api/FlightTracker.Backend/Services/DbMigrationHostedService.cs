using FlightTracker.Data;
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
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Database migration failed. The database schema likely does not match the EF migrations. " +
                "Fix by using a fresh database or baselining migrations appropriately.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
