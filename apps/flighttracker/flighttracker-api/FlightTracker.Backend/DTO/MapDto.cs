using System;
using System.Collections.Generic;

namespace FlightTracker.Backend.DTO
{

    public sealed record MapActiveResponse(
        DateTime? LastSnapshotUtc,
        int ActiveNowCutoffMinutes,
        IReadOnlyList<MapActiveItem> Items);


    public sealed record MapActiveItem(
        int Id,
        string Icao24,
        string? Callsign,
        double Lat,
        double Lon,
        double? Alt,
        double? Vel,
        double? Trk,
        DateTime LastSeenUtc,
        bool InSweden);
}
