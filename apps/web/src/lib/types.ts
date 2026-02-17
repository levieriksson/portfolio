export type StatsOverview = {
  utcNow: string;
  activeNowCutoffMinutes: number;
  flightsTodayInSweden: number;
  activeFlightsInSweden: number;
  lastSnapshotUtc: string | null;
  snapshots: number;
  sessions: number;
};

export type AircraftInfoLite = {
  manufacturerName: string | null;
  model: string | null;
  registration: string | null;
  typeCode: string | null;
  operatorName: string | null;
};

export type AircraftInfo = {
  typeCode: string | null;
  manufacturerName: string | null;
  model: string | null;
  registration: string | null;
  operatorIcao: string | null;
  operatorName: string | null;
  country: string | null;
  categoryDescription: string | null;
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

  aircraft: AircraftInfoLite | null;
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

  aircraft: AircraftInfo | null;

  snapshots: AircraftSnapshot[];
};

export type ProjectStat = {
  label: string;
  value: string | number;
};

export type Project = {
  title: string;
  subtitle: string;
  stats: ProjectStat[];
  route: string;
  key: string;
};

export type MapActiveItem = {
  id: number;
  icao24: string;
  callsign: string | null;
  lat: number | null;
  lon: number | null;
  alt: number | null;
  vel: number | null;
  trk: number | null;
  lastSeenUtc: string;
  inSweden: boolean;
  aircraft: AircraftInfoLite | null;
};

export type MapActiveResponse = {
  lastSnapshotUtc: string | null;
  activeNowCutoffMinutes: number;
  items: MapActiveItem[];
};
