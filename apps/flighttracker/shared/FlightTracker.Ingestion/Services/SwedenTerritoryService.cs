using System.Collections.Immutable;

namespace FlightTracker.Ingestion.Services;

public sealed class SwedenTerritoryService
{
    private static readonly ImmutableArray<(double Lat, double Lon)> _polygon =
        ImmutableArray.Create(
            (69.0599, 20.0000),
            (68.5000, 23.0000),
            (67.0000, 24.0000),
            (65.0000, 24.5000),
            (63.0000, 20.0000),
            (62.0000, 18.0000),
            (60.0000, 17.0000),
            (58.0000, 16.0000),
            (56.0000, 15.0000),
            (55.2000, 13.0000),
            (55.1331, 11.0000),
            (57.0000, 12.0000),
            (59.0000, 11.0000),
            (61.0000, 12.0000),
            (63.0000, 13.0000),
            (65.0000, 15.0000),
            (67.0000, 17.0000),
            (68.5000, 18.0000)
        );

    public bool IsInside(double latitude, double longitude)
    {
        var inside = false;
        var count = _polygon.Length;

        for (int i = 0, j = count - 1; i < count; j = i++)
        {
            var pi = _polygon[i];
            var pj = _polygon[j];

            var intersect =
                ((pi.Lon > longitude) != (pj.Lon > longitude)) &&
                (latitude < (pj.Lat - pi.Lat) * (longitude - pi.Lon) / (pj.Lon - pi.Lon + double.Epsilon) + pi.Lat);

            if (intersect)
                inside = !inside;
        }

        return inside;
    }
}