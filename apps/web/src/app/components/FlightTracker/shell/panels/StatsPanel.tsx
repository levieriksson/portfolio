"use client";

import { useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { apiGet } from "@/lib/api";
import type { StatsOverview } from "@/lib/types";
import { utcTodayString } from "@/lib/datetime";
import { StatCard } from "@/app/components/ui/StatCard";
import type { FlightTrackerShellVariant } from "../FlightTrackerTabsShell";
import {
  getPrefetchedStatsOverview,
  setPrefetchedStatsOverview,
} from "@/app/components/FlightTracker/statsOverviewPrefetch";

const RADIUS = 1;

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

type Props = {
  variant: FlightTrackerShellVariant;
  data: StatsOverview | null;
  error: string | null;
  onDataChange: (v: StatsOverview | null) => void;
  onErrorChange: (v: string | null) => void;
  onOpenBrowse: (opts: { date: string; activeOnly: boolean }) => void;
  onGoToTab: (tab: "stats" | "browse" | "map") => void;
};

export function StatsPanel({
  data,
  error,
  onDataChange,
  onErrorChange,
  onOpenBrowse,
}: Props) {
  useEffect(() => {
    let mounted = true;

    if (!data) {
      const pref = getPrefetchedStatsOverview();
      if (pref) onDataChange(pref);
    }

    async function load() {
      try {
        const res = await apiGet<StatsOverview>("/api/stats/overview");
        if (!mounted) return;
        onDataChange(res);
        setPrefetchedStatsOverview(res);
        onErrorChange(null);
      } catch (e) {
        if (!mounted) return;
        if (!data)
          onErrorChange(e instanceof Error ? e.message : "Failed to load");
      }
    }

    void load();
    const id = window.setInterval(load, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
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
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          label={
            <LabelWithHelp
              label="Entered Sweden today"
              help={helpFlightsToday}
            />
          }
          value={data.flightsTodayInSweden}
          onClick={() =>
            onOpenBrowse({ date: utcTodayString(), activeOnly: false })
          }
          borderRadius={RADIUS}
        />
        <StatCard
          label={<LabelWithHelp label="Active now" help={helpActiveNow} />}
          value={data.activeFlightsInSweden}
          onClick={() =>
            onOpenBrowse({ date: utcTodayString(), activeOnly: true })
          }
          borderRadius={RADIUS}
        />
        <StatCard
          label={<LabelWithHelp label="Snapshots" help={helpSnapshots} />}
          value={data.snapshots}
          borderRadius={RADIUS}
        />
        <StatCard
          label={<LabelWithHelp label="Sessions" help={helpSessions} />}
          value={data.sessions}
          borderRadius={RADIUS}
        />
      </Box>

      <Accordion
        defaultExpanded
        elevation={0}
        sx={{
          bgcolor: "transparent",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: RADIUS,
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 40,
            px: 2,
            "& .MuiAccordionSummary-content": { my: 0.25 },
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            What do these numbers mean?
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.6 }}>
            <b>Flights today</b>: sessions first observed inside the Sweden
            tracking area during the current UTC day.
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
