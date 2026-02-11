using FlightTracker.Data;
using FlightTracker.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Services;

public sealed class AircraftImportHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<AircraftImportHostedService> _logger;

    public AircraftImportHostedService(IServiceProvider sp, ILogger<AircraftImportHostedService> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _ = Task.Run(() => RunAsync(cancellationToken), cancellationToken);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task RunAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();
            var importer = scope.ServiceProvider.GetRequiredService<AircraftCsvImporter>();

            var programDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "FlightTracker");

            var candidates = new[]
            {
                Path.Combine(programDataDir, "aircraftDatabase.csv"),
                Path.Combine(AppContext.BaseDirectory, "aircraftDatabase.csv"),
            };

            var csvPath = candidates.FirstOrDefault(File.Exists);
            if (csvPath is null)
            {
                _logger.LogInformation("Aircraft CSV not found. Skipping aircraft metadata import.");
                return;
            }

            var lastWriteUtc = File.GetLastWriteTimeUtc(csvPath);



            var state = await db.AircraftImportStates.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == 1, ct);

            var alreadyImportedSameFile =
                state != null &&
                string.Equals(state.SourcePath, csvPath, StringComparison.OrdinalIgnoreCase) &&
                state.SourceLastWriteUtc.HasValue &&
                state.SourceLastWriteUtc.Value == lastWriteUtc;

            var existingCount = await db.AircraftMetadata.CountAsync(ct);

            if (existingCount == 0 || !alreadyImportedSameFile)
            {
                _logger.LogInformation("Starting aircraft metadata import from: {Path}", csvPath);

                var rows = await importer.ImportAsync(csvPath, ct);

                var now = DateTime.UtcNow;
                var existing = await db.AircraftImportStates.FirstOrDefaultAsync(x => x.Id == 1, ct);
                if (existing is null)
                {
                    db.AircraftImportStates.Add(new AircraftImportState
                    {
                        Id = 1,
                        LastImportedUtc = now,
                        SourcePath = csvPath,
                        SourceLastWriteUtc = lastWriteUtc,
                        ImportedRows = rows
                    });
                }
                else
                {
                    existing.LastImportedUtc = now;
                    existing.SourcePath = csvPath;
                    existing.SourceLastWriteUtc = lastWriteUtc;
                    existing.ImportedRows = rows;
                }

                await db.SaveChangesAsync(ct);

                _logger.LogInformation("Aircraft metadata import finished. Rows processed: {Rows}", rows);
            }
            else
            {
                _logger.LogInformation("Aircraft metadata already imported for current CSV. Skipping.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Aircraft metadata import failed.");
        }
    }
}
