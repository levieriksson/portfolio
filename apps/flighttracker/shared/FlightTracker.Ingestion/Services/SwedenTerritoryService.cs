using System.Linq;
using NetTopologySuite.Geometries;
using NetTopologySuite.Geometries.Prepared;
using NetTopologySuite.IO.GeoJSON;

namespace FlightTracker.Ingestion.Services;

public sealed class SwedenTerritoryService
{
    private readonly IPreparedGeometry _prepared;

    public SwedenTerritoryService()
    {
        var geo = LoadSwedenGeometry();
        _prepared = PreparedGeometryFactory.Prepare(geo);
    }

    public bool IsInside(double latitude, double longitude)
    {
        var p = new Point(longitude, latitude) { SRID = 4326 };
        return _prepared.Covers(p);
    }

    private static Geometry LoadSwedenGeometry()
    {
        var baseDir = AppContext.BaseDirectory;
        var path = Path.Combine(baseDir, "Geo", "sweden.geojson");
        if (!File.Exists(path))
            throw new FileNotFoundException($"Missing GeoJSON file: {path}");

        var geoJson = File.ReadAllText(path);

        var reader = new GeoJsonReader(new GeometryFactory(new PrecisionModel(), 4326));
        var obj = reader.Read<NetTopologySuite.Features.FeatureCollection>(geoJson);

        var geoms = obj
            .Select(f => f.Geometry)
            .Where(g => g != null)
            .ToArray();

        if (geoms.Length == 0)
            throw new InvalidOperationException("GeoJSON contained no geometries.");

        if (geoms.Length == 1)
            return geoms[0];

        return new GeometryCollection(geoms, new GeometryFactory(new PrecisionModel(), 4326)).Union();
    }
}