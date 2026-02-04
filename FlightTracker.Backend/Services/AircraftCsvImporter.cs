using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using FlightTracker.Backend.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlightTracker.Backend.Services;

public sealed class AircraftCsvImporter
{
    private readonly FlightDbContext _db;
    private readonly ILogger<AircraftCsvImporter> _logger;

    public AircraftCsvImporter(FlightDbContext db, ILogger<AircraftCsvImporter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<long> ImportAsync(string csvPath, CancellationToken ct)
    {
        if (!File.Exists(csvPath))
            throw new FileNotFoundException("Aircraft CSV not found.", csvPath);





        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            Delimiter = ",",
            Quote = '\'',
            Escape = '\'',
            BadDataFound = null,
            MissingFieldFound = null,
            HeaderValidated = null,
            DetectColumnCountChanges = false,
            TrimOptions = TrimOptions.Trim,
        };

        await using var fs = File.OpenRead(csvPath);
        using var sr = new StreamReader(fs);
        using var csv = new CsvReader(sr, config);

        var conn = (SqliteConnection)_db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync(ct);


        await using (var pragma = conn.CreateCommand())
        {
            pragma.CommandText = "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;";
            await pragma.ExecuteNonQueryAsync(ct);
        }

        await using var tx = conn.BeginTransaction();
        using var cmd = conn.CreateCommand();
        cmd.Transaction = tx;


        cmd.CommandText = @"
INSERT INTO AircraftMetadata (
    Icao24, Timestamp, TypeCode, ManufacturerName, Model, Registration,
    OperatorIcao, OperatorName, Country, CategoryDescription, UpdatedUtc
) VALUES (
    $icao24, $ts, $typecode, $mfr, $model, $reg,
    $opIcao, $opName, $country, $catDesc, $updatedUtc
)
ON CONFLICT(Icao24) DO UPDATE SET
    Timestamp = excluded.Timestamp,
    TypeCode = excluded.TypeCode,
    ManufacturerName = excluded.ManufacturerName,
    Model = excluded.Model,
    Registration = excluded.Registration,
    OperatorIcao = excluded.OperatorIcao,
    OperatorName = excluded.OperatorName,
    Country = excluded.Country,
    CategoryDescription = excluded.CategoryDescription,
    UpdatedUtc = excluded.UpdatedUtc
WHERE excluded.Timestamp > AircraftMetadata.Timestamp;
";


        cmd.Parameters.Add(new SqliteParameter("$icao24", ""));
        cmd.Parameters.Add(new SqliteParameter("$ts", 0L));
        cmd.Parameters.Add(new SqliteParameter("$typecode", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$mfr", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$model", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$reg", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$opIcao", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$opName", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$country", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$catDesc", DBNull.Value));
        cmd.Parameters.Add(new SqliteParameter("$updatedUtc", ""));

        static object DbOrNull(string? s)
            => string.IsNullOrWhiteSpace(s) ? DBNull.Value : s.Trim();

        long rows = 0;
        const int logEvery = 50_000;
        var updatedUtc = DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture);

        await csv.ReadAsync();
        csv.ReadHeader();

        while (await csv.ReadAsync())
        {
            ct.ThrowIfCancellationRequested();

            var icao24 = (csv.GetField("icao24") ?? "").Trim().ToLowerInvariant();
            if (icao24.Length != 6) continue;

            var tsStr = (csv.GetField("timestamp") ?? "").Trim();
            _ = long.TryParse(tsStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out var ts);

            cmd.Parameters["$icao24"].Value = icao24;
            cmd.Parameters["$ts"].Value = ts;
            cmd.Parameters["$typecode"].Value = DbOrNull(csv.GetField("typecode"));
            cmd.Parameters["$mfr"].Value = DbOrNull(csv.GetField("manufacturerName"));
            cmd.Parameters["$model"].Value = DbOrNull(csv.GetField("model"));
            cmd.Parameters["$reg"].Value = DbOrNull(csv.GetField("registration"));
            cmd.Parameters["$opIcao"].Value = DbOrNull(csv.GetField("operatorIcao"));
            cmd.Parameters["$opName"].Value = DbOrNull(csv.GetField("operator"));
            cmd.Parameters["$country"].Value = DbOrNull(csv.GetField("country"));
            cmd.Parameters["$catDesc"].Value = DbOrNull(csv.GetField("categoryDescription"));
            cmd.Parameters["$updatedUtc"].Value = updatedUtc;

            await cmd.ExecuteNonQueryAsync(ct);
            rows++;

            if (rows % logEvery == 0)
                _logger.LogInformation("Aircraft metadata import progress: {Rows} rows processed...", rows);
        }

        await tx.CommitAsync(ct);

        _logger.LogInformation("Aircraft metadata import complete: {Rows} rows processed.", rows);
        return rows;
    }
}
