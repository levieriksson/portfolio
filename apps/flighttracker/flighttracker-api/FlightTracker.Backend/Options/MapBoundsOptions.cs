namespace FlightTracker.Backend.Options;

public sealed class MapBoundsOptions
{

    public double DefaultLonMin { get; init; } = 10.0;
    public double DefaultLatMin { get; init; } = 54.5;
    public double DefaultLonMax { get; init; } = 26.5;
    public double DefaultLatMax { get; init; } = 70.5;


    public double ClampLonMin { get; init; } = 10.0;
    public double ClampLatMin { get; init; } = 54.5;
    public double ClampLonMax { get; init; } = 26.5;
    public double ClampLatMax { get; init; } = 70.5;
}
