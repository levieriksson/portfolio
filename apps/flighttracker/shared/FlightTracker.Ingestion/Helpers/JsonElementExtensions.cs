using System.Globalization;
using System.Text.Json;

namespace FlightTracker.Ingestion.Helpers;

public static class JsonElementExtensions
{
    public static double? GetDoubleOrNull(this JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return null;

        if (element.ValueKind == JsonValueKind.Number && element.TryGetDouble(out var d))
            return d;

        if (element.ValueKind == JsonValueKind.String)
        {
            var s = element.GetString();
            if (string.IsNullOrWhiteSpace(s))
                return null;

            if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed))
                return parsed;
        }

        return null;
    }
}
