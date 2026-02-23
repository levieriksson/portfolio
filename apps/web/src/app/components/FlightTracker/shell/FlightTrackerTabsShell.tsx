"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, Button, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import type { StatsOverview } from "@/lib/types";
import { utcTodayString } from "@/lib/datetime";

import { FlightDetailsDrawer } from "@/app/components/FlightTracker/FlightDetailsDrawer";
import { StatsPanel } from "./panels/StatsPanel";
import { BrowsePanel } from "./panels/BrowsePanel";
import { MapPanel } from "./panels/MapPanel";

export type FlightTrackerShellVariant = "modal" | "page";
type TabKey = "stats" | "browse" | "map";

type Props = {
  variant: FlightTrackerShellVariant;
  defaultTab?: TabKey;
  trailEnabled?: boolean;
  exactMode?: boolean;
};

export function FlightTrackerTabsShell({
  variant,
  defaultTab,
  trailEnabled = false,
  exactMode = false,
}: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const mapOnly = variant === "page" && !isMdUp;

  const initialTab: TabKey = useMemo(() => {
    if (mapOnly) return "map";
    if (defaultTab) return defaultTab;
    return variant === "page" ? "map" : "stats";
  }, [defaultTab, mapOnly, variant]);

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [fitToken, setFitToken] = useState(0);

  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [browserDate, setBrowserDate] = useState(utcTodayString());
  const [browserActiveOnly, setBrowserActiveOnly] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const openBrowse = (opts: { date: string; activeOnly: boolean }) => {
    setBrowserDate(opts.date);
    setBrowserActiveOnly(opts.activeOnly);
    setTab("browse");
  };

  const handleSelectSession = (id: number) => {
    setSelectedId(id);
    setDetailsOpen(true);
  };

  const effectiveTab: TabKey = mapOnly ? "map" : tab;

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!mapOnly ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: variant === "modal" ? 0 : 2,
          }}
        >
          <Tabs
            value={effectiveTab}
            onChange={(_, v: TabKey) => {
              setTab(v);
              if (v === "map") setFitToken((t) => t + 1);
            }}
            textColor="inherit"
            indicatorColor="primary"
            variant={isMdUp ? "standard" : "fullWidth"}
            sx={{
              flex: 1,
              minHeight: { xs: 34, md: 40 },
              "& .MuiTabs-flexContainer": { gap: isMdUp ? 1 : 0 },
              "& .MuiTab-root": {
                minHeight: { xs: 34, md: 40 },
                px: 1.25,
                py: { xs: 0.25, md: 0.75 },
                textTransform: "none",
                fontWeight: 600,
                letterSpacing: 0,
              },
            }}
          >
            <Tab disableRipple value="stats" label="Stats" />
            <Tab disableRipple value="browse" label="Browse" />
            <Tab disableRipple value="map" label="Map" />
          </Tabs>

          {variant === "modal" && isMdUp ? (
            <Button
              component={Link}
              href="/flight-tracker"
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon fontSize="small" />}
              sx={{
                borderRadius: 0.75,
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                height: 30,
                mb: 1,
              }}
            >
              Full analytics
            </Button>
          ) : null}
        </Box>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {effectiveTab === "stats" ? (
          <StatsPanel
            variant={variant}
            data={stats}
            error={statsError}
            onDataChange={setStats}
            onErrorChange={setStatsError}
            onOpenBrowse={openBrowse}
            onGoToTab={setTab}
          />
        ) : effectiveTab === "browse" ? (
          <BrowsePanel
            variant={variant}
            stats={stats}
            browserDate={browserDate}
            browserActiveOnly={browserActiveOnly}
            onSelectSession={handleSelectSession}
          />
        ) : (
          <MapPanel
            variant={variant}
            trailEnabled={trailEnabled}
            exactMode={exactMode}
            fitToken={fitToken}
          />
        )}
      </Box>

      <FlightDetailsDrawer
        open={detailsOpen}
        sessionId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </Box>
  );
}
