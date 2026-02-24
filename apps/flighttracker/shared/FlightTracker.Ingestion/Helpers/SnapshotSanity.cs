namespace FlightTracker.Ingestion.Helpers;

public static class SnapshotSanity
{
    public static (bool IsValid, double? Altitude, double? Velocity, string? Reason)
        ValidateAndFilter(
            double? latitude,
            double? longitude,
            double? altitude,
            double? velocity,
            int maxAltitudeM,
            double maxVelocityMps)
    {

        if (latitude is null || longitude is null) return (false, altitude, velocity, "missing_position");
        if (!IsFinite(latitude.Value) || !IsFinite(longitude.Value)) return (false, altitude, velocity, "nan_or_inf_position");
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return (false, altitude, velocity, "position_out_of_range");

        string? reason = null;


        if (altitude is double a)
        {
            if (!IsFinite(a) || a < -500 || a > maxAltitudeM)
            {
                altitude = null;
                reason = "altitude_outlier";
            }
        }


        if (velocity is double v)
        {
            if (!IsFinite(v) || v < 0 || v > maxVelocityMps)
            {
                velocity = null;
                reason ??= "velocity_outlier";
            }
        }

        return (true, altitude, velocity, reason);
    }

    private static bool IsFinite(double v) => !(double.IsNaN(v) || double.IsInfinity(v));
}