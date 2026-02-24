using FlightTracker.Ingestion.Options;
using FlightTracker.Ingestion.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FlightTracker.Backend.Services;

public sealed class OpenSkyIngestionService : BackgroundService
{
    private readonly OpenSkyIngestionRunner _runner;
    private readonly IngestionOptions _ingestion;
    private readonly ILogger<OpenSkyIngestionService> _logger;

    public OpenSkyIngestionService(
        OpenSkyIngestionRunner runner,
        IOptions<IngestionOptions> ingestion,
        ILogger<OpenSkyIngestionService> logger)
    {
        _runner = runner;
        _ingestion = ingestion.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromMinutes(5);

        _logger.LogInformation(
            "Ingestion hosted service started. Interval={IntervalMinutes}m, SessionGapSeconds={GapSeconds}",
            interval.TotalMinutes,
            _ingestion.SessionGapSeconds);

        using var timer = new PeriodicTimer(interval);

        await _runner.RunOnceAsync(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await _runner.RunOnceAsync(stoppingToken);
        }
    }
}