"use client";

import { Box, Typography } from "@mui/material";
import type { StatsOverview } from "@/lib/types";
import { formatLocalDateTime } from "@/lib/datetime";
import { FlightsBrowser } from "@/app/components/FlightTracker/FlightsBrowser";
import type { FlightTrackerShellVariant } from "../FlightTrackerTabsShell";

const RADIUS = 1;

type Props = {
  variant: FlightTrackerShellVariant;
  stats: StatsOverview | null;
  browserDate: string;
  browserActiveOnly: boolean;
  onSelectSession: (id: number) => void;
};

export function BrowsePanel({
  stats,
  browserDate,
  browserActiveOnly,
  onSelectSession,
}: Props) {
  const lastSnapshotText = stats?.lastSnapshotUtc
    ? formatLocalDateTime(stats.lastSnapshotUtc)
    : "—";

  return (
    <Box sx={{ height: "100%", minHeight: 0, p: 2 }}>
      <Box
        sx={{
          height: "100%",
          minHeight: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: RADIUS,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
            onSelectSession={onSelectSession}
          />
        </Box>
      </Box>
    </Box>
  );
}
