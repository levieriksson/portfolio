"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Collapse,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { StatCard } from "../ui/StatCard";
import { apiGet } from "@/lib/api";
import type { StatsOverview } from "@/lib/types";
import { formatLocalDateTime, utcTodayString } from "@/lib/datetime";
import { FlightsBrowser } from "./FlightsBrowser";
import { FlightDetailsDrawer } from "./FlightDetailsDrawer";
import { InteractiveMapModalButton } from "./map/InteractiveMapModalButton";

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

export function FlightTrackerLiveOverview() {
  const [data, setData] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [browserOpen, setBrowserOpen] = useState(false);
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

  const openFlightsToday = () => {
    setBrowserDate(utcTodayString());
    setBrowserActiveOnly(false);
    setBrowserOpen(true);
  };

  const openActiveNow = () => {
    setBrowserDate(utcTodayString());
    setBrowserActiveOnly(true);
    setBrowserOpen(true);
  };

  const handleSelectSession = (id: number) => {
    setSelectedId(id);
    setDetailsOpen(true);
  };

  const lastSnapshotText = data.lastSnapshotUtc
    ? formatLocalDateTime(data.lastSnapshotUtc)
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Collapse in={!browserOpen} timeout={180} unmountOnExit>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
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
            onClick={openFlightsToday}
            borderRadius={RADIUS}
          />
          <StatCard
            label={<LabelWithHelp label="Active now" help={helpActiveNow} />}
            value={data.activeFlightsInSweden}
            onClick={openActiveNow}
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
      </Collapse>

      <Accordion
        expanded={browserOpen}
        onChange={(_, expanded) => setBrowserOpen(expanded)}
        TransitionProps={{ unmountOnExit: true }}
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
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
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
          {browserOpen ? (
            <FlightsBrowser
              initialDate={browserDate}
              initialActiveOnly={browserActiveOnly}
              onSelectSession={handleSelectSession}
            />
          ) : null}
        </AccordionDetails>
      </Accordion>

      <Collapse in={!browserOpen} timeout={180} unmountOnExit>
        <Accordion
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
      </Collapse>
      <Collapse in={!browserOpen} timeout={180} unmountOnExit>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <InteractiveMapModalButton />
        </Box>
      </Collapse>
      <FlightDetailsDrawer
        open={detailsOpen}
        sessionId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </Box>
  );
}
