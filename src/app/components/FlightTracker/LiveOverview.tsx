"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { StatCard } from "../ui/StatCard";
import { apiGet } from "@/lib/api";
import type { StatsOverview } from "@/lib/types";
import { formatUtcDateTime, formatLocalDateTime } from "@/lib/datetime";

function LabelWithHelp({ label, help }: { label: string; help: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <span>{label}</span>
      <Tooltip title={help} arrow>
        <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.75 }} />
      </Tooltip>
    </Box>
  );
}

export function FlightTrackerLiveOverview() {
  const [data, setData] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <Box sx={{ color: "error.main" }}>Failed to load live stats: {error}</Box>
    );
  }

  if (!data) {
    return <Box sx={{ opacity: 0.7 }}>Loading live stats…</Box>;
  }

  const cutoff = data.activeNowCutoffMinutes ?? 25;

  const helpFlightsToday =
    "Flights today = sessions first observed inside the Sweden tracking area during the current UTC day.";
  const helpActiveNow =
    `Active now = sessions seen within the last ${cutoff} minutes (UTC) inside the Sweden tracking area. ` +
    "This is time-window based to avoid inflating counts from long session timeouts.";
  const helpSnapshots =
    "Snapshots = raw position samples ingested from OpenSky (multiple per flight).";
  const helpSessions =
    "Sessions = aggregated flight tracks built from snapshots. A session closes after a data gap.";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 3,
        }}
      >
        <StatCard
          label={
            <LabelWithHelp label="Flights today" help={helpFlightsToday} />
          }
          value={data.flightsTodayInSweden}
        />
        <StatCard
          label={<LabelWithHelp label="Active now" help={helpActiveNow} />}
          value={data.activeFlightsInSweden}
        />
        <StatCard
          label={<LabelWithHelp label="Snapshots" help={helpSnapshots} />}
          value={data.snapshots}
        />
        <StatCard
          label={<LabelWithHelp label="Sessions" help={helpSessions} />}
          value={data.sessions}
        />
      </Box>

      <Divider />

      <Box sx={{ fontSize: 12, opacity: 0.75 }}>
        Last snapshot:{" "}
        {data.lastSnapshotUtc ? formatLocalDateTime(data.lastSnapshotUtc) : "—"}
      </Box>

      <Accordion
        elevation={0}
        sx={{
          bgcolor: "transparent",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 2,
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            What do these numbers mean?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.6 }}>
            <b>Flights today</b>: sessions first observed in the Sweden tracking
            area during the current UTC day.
            <br />
            <b>Active now</b>: seen within the last <b>{cutoff} minutes</b>{" "}
            (UTC).
            <br />
            <b>Snapshots</b>: raw samples (many per flight).
            <br />
            <b>Sessions</b>: aggregated tracks; closed after a data gap.
            <br />
            Data source: OpenSky. Coverage and update frequency can vary.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
