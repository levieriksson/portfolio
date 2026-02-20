using System;
using System.Collections.Generic;

namespace FlightTracker.Backend.DTO;

public sealed record AircraftInfoLite(
    string? ManufacturerName,
    string? Model,
    string? Registration,
    string? TypeCode,
    string? OperatorName
);

public sealed record MapActiveResponse(
    DateTime? LastSnapshotUtc,
    int ActiveNowCutoffMinutes,
    IReadOnlyList<MapActiveItem> Items
);

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
    bool InSweden,
    AircraftInfoLite? Aircraft
);