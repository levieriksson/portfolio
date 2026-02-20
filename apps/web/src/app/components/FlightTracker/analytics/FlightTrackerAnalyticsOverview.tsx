"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { apiGet } from "@/lib/api";
import type { StatsOverview } from "@/lib/types";
import { formatLocalDateTime, utcTodayString } from "@/lib/datetime";
import { FlightsBrowser } from "@/app/components/FlightTracker/FlightsBrowser";
import { FlightDetailsDrawer } from "@/app/components/FlightTracker/FlightDetailsDrawer";

const RADIUS = 1;

export function FlightTrackerAnalyticsOverview() {
  const [data, setData] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [browserDate, setBrowserDate] = useState(utcTodayString());
  const [browserActiveOnly, setBrowserActiveOnly] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiGet<StatsOverview>("/api/stats/overview");
        if (!mounted) return;
        setData(res);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    }

    load();
    const id = setInterval(load, 30_000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleSelectSession = (id: number) => {
    setSelectedId(id);
    setDetailsOpen(true);
  };

  const lastSnapshotText = data?.lastSnapshotUtc
    ? formatLocalDateTime(data.lastSnapshotUtc)
    : "—";

  if (error) {
    return (
      <Box sx={{ height: "100%", color: "error.main" }}>
        Failed to load live stats: {error}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: RADIUS,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Browse flights
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Typography
            variant="caption"
            sx={{ opacity: 0.7, whiteSpace: "nowrap" }}
          >
            Last snapshot: {lastSnapshotText}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
          <FlightsBrowser
            initialDate={browserDate}
            initialActiveOnly={browserActiveOnly}
            onSelectSession={handleSelectSession}
          />
        </Box>
      </Box>

      <FlightDetailsDrawer
        open={detailsOpen}
        sessionId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </Box>
  );
}
