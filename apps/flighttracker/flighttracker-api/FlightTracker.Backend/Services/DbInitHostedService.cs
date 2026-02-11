using FlightTracker.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public class DbInitHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<DbInitHostedService> _logger;

    public DbInitHostedService(IServiceProvider sp, ILogger<DbInitHostedService> logger)
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
            await db.Database.EnsureCreatedAsync(cancellationToken);
            _logger.LogInformation("Database ensured/created.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database initialization failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
