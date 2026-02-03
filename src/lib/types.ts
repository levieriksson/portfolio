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
