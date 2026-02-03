using FlightTracker.Backend.Data;
using FlightTracker.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FlightTracker.Backend.Services;

public class OpenSkyIngestionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly OpenSkyAuthService _authService;

    // Sweden bounding box
    private const double LatMin = 55.1331;
    private const double LatMax = 69.0599;
    private const double LonMin = 10.5931;
    private const double LonMax = 24.1777;

    public OpenSkyIngestionService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;

        var clientId = Environment.GetEnvironmentVariable("OPENSKY_USERNAME")?.Trim();
        var clientSecret = Environment.GetEnvironmentVariable("OPENSKY_PASSWORD")?.Trim();

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            throw new Exception("OpenSky credentials are missing in environment variables.");

        _authService = new OpenSkyAuthService(clientId, clientSecret);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<FlightDbContext>();
                var client = await _authService.GetAuthorizedClientAsync();

                Console.WriteLine($"[Ingestion] Starting save to DB at {DateTime.UtcNow}...");

                using var responseStream = await client.GetStreamAsync("https://opensky-network.org/api/states/all", stoppingToken);
                using var doc = await JsonDocument.ParseAsync(responseStream, cancellationToken: stoppingToken);

                if (!doc.RootElement.TryGetProperty("states", out var statesElement) || statesElement.ValueKind != JsonValueKind.Array)
                {
                    Console.WriteLine("[Ingestion] No states returned from API.");
                }
                else
                {
                    var snapshots = new List<AircraftSnapshot>();

                    foreach (var stateArray in statesElement.EnumerateArray())
                    {
                        var latitude = stateArray[6].GetDoubleOrNull();
                        var longitude = stateArray[5].GetDoubleOrNull();

                        if (latitude == null || longitude == null)
                            continue;

                        if (latitude < LatMin || latitude > LatMax || longitude < LonMin || longitude > LonMax)
                            continue;

                        snapshots.Add(new AircraftSnapshot
                        {
                            Icao24 = stateArray[0].GetString() ?? "",
                            Callsign = stateArray[1].GetString()?.Trim(),
                            OriginCountry = stateArray[2].GetString() ?? "",
                            Longitude = longitude,
                            Latitude = latitude,
                            Altitude = stateArray[7].GetDoubleOrNull(),
                            Velocity = stateArray[9].GetDoubleOrNull(),
                            TimestampUtc = DateTimeOffset.FromUnixTimeSeconds(stateArray[4].GetInt64()).UtcDateTime
                        });
                    }

                    await db.AircraftSnapshots.AddRangeAsync(snapshots, stoppingToken);
                    await db.SaveChangesAsync(stoppingToken);

                    Console.WriteLine($"[Ingestion] Completed save. {snapshots.Count} Swedish snapshots added at {DateTime.UtcNow}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ingestion] Error: {ex.Message} at {DateTime.UtcNow}");
            }

            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }
}

// Helper extension to safely parse nullable doubles
public static class JsonElementExtensions
{
    public static double? GetDoubleOrNull(this JsonElement element)
        => element.ValueKind == JsonValueKind.Number ? element.GetDouble() : null;
}
