"use client";

import { useEffect, useState } from "react";
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
import type { AnalyticsActivityResponseDto, StatsOverview } from "@/lib/types";
import {
  formatStockholmHour,
  formatStockholmMonthDay,
  utcTodayString,
} from "@/lib/datetime";
import { StatCard } from "@/app/components/ui/StatCard";
import type { FlightTrackerShellVariant } from "../FlightTrackerTabsShell";
import {
  getPrefetchedStatsOverview,
  setPrefetchedStatsOverview,
} from "@/app/components/FlightTracker/statsOverviewPrefetch";
import { ActivityCharts } from "./charts/ActivityCharts";

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
  variant,
  data,
  error,
  onDataChange,
  onErrorChange,
  onOpenBrowse,
}: Props) {
  const [activity24, setActivity24] =
    useState<AnalyticsActivityResponseDto | null>(null);
  const [activity7, setActivity7] =
    useState<AnalyticsActivityResponseDto | null>(null);

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

    async function loadActivity() {
      try {
        const [a24, a7] = await Promise.all([
          apiGet<AnalyticsActivityResponseDto>(
            "/api/analytics/activity?range=24h",
          ),
          apiGet<AnalyticsActivityResponseDto>(
            "/api/analytics/activity?range=7d",
          ),
        ]);
        if (!mounted) return;
        setActivity24(a24);
        setActivity7(a7);
      } catch {
        if (!mounted) return;
      }
    }

    void load();
    const id = window.setInterval(load, 30_000);

    let chartsId: number | undefined;
    if (variant === "page") {
      void loadActivity();
      chartsId = window.setInterval(loadActivity, 5 * 60_000);
    }

    return () => {
      mounted = false;
      window.clearInterval(id);
      if (chartsId) window.clearInterval(chartsId);
    };
  }, [variant]);

  if (error) {
    return (
      <Box sx={{ color: "error.main" }}>Failed to load live stats: {error}</Box>
    );
  }

  if (!data) {
    return <Box sx={{ opacity: 0.7 }}>Loading live stats…</Box>;
  }

  const cutoff = data.activeCutoffMinutes;

  const helpFlightsToday =
    "Flights today = sessions seen since 00:00 in Sweden time (Europe/Stockholm).";
  const helpActiveNow = `Active now = sessions seen within the last ${cutoff} minutes (UTC).`;
  const helpInSwedenNow =
    "In Sweden now = active sessions whose latest known position is inside Sweden (polygon).";
  const helpUniqueAircraft = `Unique aircraft = distinct ICAO24 seen in the last ${data.windowHours} hours.`;

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
            <LabelWithHelp label="Flights today" help={helpFlightsToday} />
          }
          value={data.flightsToday}
          onClick={() =>
            onOpenBrowse({ date: utcTodayString(), activeOnly: false })
          }
          borderRadius={RADIUS}
        />

        <StatCard
          label={<LabelWithHelp label="Active now" help={helpActiveNow} />}
          value={data.activeNow}
          onClick={() =>
            onOpenBrowse({ date: utcTodayString(), activeOnly: true })
          }
          borderRadius={RADIUS}
        />

        <StatCard
          label={<LabelWithHelp label="In Sweden now" help={helpInSwedenNow} />}
          value={data.inSwedenNow}
          borderRadius={RADIUS}
        />

        <StatCard
          label={
            <LabelWithHelp label="Unique aircraft" help={helpUniqueAircraft} />
          }
          value={data.uniqueAircraftInWindow}
          borderRadius={RADIUS}
        />
      </Box>

      {variant === "page" && activity24 && (
        <ActivityCharts
          title="Activity (last 24h)"
          help="Sessions seen = count of sessions whose LastSeenUtc falls within each hour. Entered Sweden = count of sessions with EnteredSwedenUtc in that hour."
          data={activity24}
          tickLabel={formatStockholmHour}
        />
      )}

      {variant === "page" && activity7 && (
        <ActivityCharts
          title="Activity (last 7d)"
          help="Daily buckets in Sweden time. Sessions seen = sessions seen that day. Entered Sweden = sessions that entered Sweden that day."
          data={activity7}
          tickLabel={formatStockholmMonthDay}
        />
      )}

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
            <b>Flights today</b>: sessions seen since 00:00 in Sweden time
            (Europe/Stockholm).
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
