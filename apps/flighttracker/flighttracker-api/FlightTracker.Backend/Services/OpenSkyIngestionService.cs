using FlightTracker.Ingestion.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FlightTracker.Backend.Services;

public sealed class OpenSkyIngestionService : BackgroundService
{
    private readonly OpenSkyIngestionRunner _runner;
    private readonly OpenSkyOptions _options;
    private readonly ILogger<OpenSkyIngestionService> _logger;

    public OpenSkyIngestionService(
        OpenSkyIngestionRunner runner,
        IOptions<OpenSkyOptions> options,
        ILogger<OpenSkyIngestionService> logger)
    {
        _runner = runner;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Ingestion started. Interval={Interval}s, GapClose={Gap}s",
            _options.IntervalSeconds,
            _options.SessionGapSeconds);

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_options.IntervalSeconds));

        await _runner.RunOnceAsync(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await _runner.RunOnceAsync(stoppingToken);
        }
    }
}
