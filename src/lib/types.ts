export type StatsOverview = {
  utcNow: string;
  activeNowCutoffMinutes: number;
  flightsTodayInSweden: number;
  activeFlightsInSweden: number;
  lastSnapshotUtc: string | null;
  snapshots: number;
  sessions: number;
};

export type FlightsPageItem = {
  id: number;
  icao24: string;
  callsign: string | null;
  firstSeenUtc: string;
  lastSeenUtc: string;
  endUtc: string | null;
  isActive: boolean;
  snapshotCount: number;
  maxAltitude: number | null;
};

export type FlightsPage = {
  date: string;
  page: number;
  pageSize: number;
  total: number;
  items: FlightsPageItem[];
};

export type AircraftSnapshot = {
  id: number;
  icao24: string;
  callsign: string | null;
  originCountry: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  velocity: number | null;
  timestampUtc: string;
  flightSessionId: number | null;
  inSweden: boolean;
};

export type FlightSessionDetails = {
  id: number;
  icao24: string;
  callsign: string | null;

  firstSeenUtc: string;
  lastSeenUtc: string;

  isActive: boolean;
  endUtc: string | null;
  closeReason: string | null;

  snapshotCount: number;

  maxAltitude: number | null;
  avgAltitude: number | null;

  enteredSwedenUtc: string | null;
  exitedSwedenUtc: string | null;

  snapshots: AircraftSnapshot[];
};
