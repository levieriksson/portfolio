using System.Text.Json;

namespace FlightTracker.Backend.Services;

public static class JsonElementExtensions
{
    public static double? GetDoubleOrNull(this JsonElement element)
        => element.ValueKind == JsonValueKind.Number ? element.GetDouble() : null;
}
