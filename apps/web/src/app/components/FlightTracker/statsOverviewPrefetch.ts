"use client";

import { apiGet } from "@/lib/api";
import type { StatsOverview } from "@/lib/types";

let cached: StatsOverview | null = null;
let inFlight: Promise<StatsOverview> | null = null;

export function prefetchStatsOverview(): Promise<StatsOverview> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = apiGet<StatsOverview>("/api/stats/overview").then((res) => {
    cached = res;
    inFlight = null;
    return res;
  });

  return inFlight;
}

export function getPrefetchedStatsOverview(): StatsOverview | null {
  return cached;
}

export function setPrefetchedStatsOverview(res: StatsOverview) {
  cached = res;
}
