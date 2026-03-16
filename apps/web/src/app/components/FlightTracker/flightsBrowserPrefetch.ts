"use client";

import { apiGet } from "@/lib/api";
import type { FlightsPage } from "@/lib/types";
import { utcTodayString } from "@/lib/datetime";

let cached: FlightsPage | null = null;
let inFlight: Promise<FlightsPage> | null = null;

export function prefetchDefaultFlightsPage(): Promise<FlightsPage> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  const params = new URLSearchParams({
    date: utcTodayString(),
    page: "1",
    pageSize: "15",
    sort: "lastSeenDesc",
  });

  inFlight = apiGet<FlightsPage>(`/api/flights?${params.toString()}`).then(
    (res) => {
      cached = res;
      inFlight = null;
      return res;
    },
  );

  return inFlight;
}

export function getPrefetchedDefaultFlightsPage(): FlightsPage | null {
  return cached;
}

export function setPrefetchedDefaultFlightsPage(res: FlightsPage) {
  cached = res;
}
