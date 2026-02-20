"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { getProject } from "@/data/projects";
import InteractiveMap from "@/app/components/FlightTracker/map/InteractiveMap";
import { FlightTrackerAnalyticsOverview } from "@/app/components/FlightTracker/analytics/FlightTrackerAnalyticsOverview";

type ViewKey = "map" | "overview";

const TAB_WIDTH = 120;

export function FlightTrackerAnalyticsPage() {
  const project = getProject("flight-tracker");
  const [view, setView] = useState<ViewKey>("map");

  const [trailEnabled, setTrailEnabled] = useState(false);
  const [exactMode, setExactMode] = useState(false);

  const trailHelp =
    "Trail: shows the recent path of the selected aircraft (e.g. last ~60 minutes).";
  const exactHelp =
    "Exact mode: only show aircraft strictly inside Sweden (future: polygon boundary). Off = nearby tracking area.";

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, minHeight: 42, px: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
            sx={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}
          >
            {project?.title ?? "Flight Tracker"} — Analytics
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title={trailHelp} arrow>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={trailEnabled}
                    onChange={(e) => setTrailEnabled(e.target.checked)}
                  />
                }
                label={
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Trail
                    </Typography>
                    <InfoOutlinedIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  </Box>
                }
              />
            </Tooltip>

            <Tooltip title={exactHelp} arrow>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={exactMode}
                    onChange={(e) => setExactMode(e.target.checked)}
                  />
                }
                label={
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Exact
                    </Typography>
                    <InfoOutlinedIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  </Box>
                }
              />
            </Tooltip>
          </Box>

          <Button
            component={Link}
            href="/"
            color="inherit"
            variant="outlined"
            size="small"
            sx={{ py: 0.25 }}
          >
            Back to portfolio
          </Button>
        </Toolbar>

        <Tabs
          value={view}
          onChange={(_, v: ViewKey) => setView(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            px: 2,
            minHeight: 32,
            "& .MuiTabs-flexContainer": { gap: 1 },
            "& .MuiTab-root": {
              width: TAB_WIDTH,
              minWidth: TAB_WIDTH,
              minHeight: 32,
              px: 1.25,
              py: 0.5,
              textTransform: "none",
              fontWeight: 500,
              letterSpacing: 0,
            },
          }}
        >
          <Tab value="map" label="Map" />
          <Tab value="overview" label="Overview" />
        </Tabs>
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {view === "map" ? (
          <Box sx={{ height: "100%", minHeight: 0, p: 1.5 }}>
            <Box
              sx={(t) => ({
                height: "100%",
                minHeight: 0,
                border: `1px solid ${t.palette.divider}`,
                borderRadius: 0,
                overflow: "hidden",
                bgcolor: "background.paper",
              })}
            >
              <InteractiveMap
                height="100%"
                borderRadius={0}
                showHeader={false}
                constraintsMode="page"
                trailEnabled={trailEnabled}
                exactMode={exactMode}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ height: "100%", minHeight: 0, p: 2, overflow: "hidden" }}>
            <FlightTrackerAnalyticsOverview />
          </Box>
        )}
      </Box>
    </Box>
  );
}
