"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  FormControlLabel,
  IconButton,
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
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
type ViewKey = "map" | "overview";

const TAB_WIDTH = 120;
const RADIUS = 1;

export function FlightTrackerAnalyticsPage() {
  const project = getProject("flight-tracker");
  const [view, setView] = useState<ViewKey>("map");

  const [trailEnabled, setTrailEnabled] = useState(false);

  const exactMode = false;
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const trailHelp =
    "Trail: shows the recent path of the selected aircraft (e.g. last ~60 minutes).";
  const exactHelp =
    "Coming soon: polygon-based Sweden boundary (true Sweden-only).";

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper" }}
      >
        {isMdUp ? (
          <Toolbar sx={{ gap: 2, minHeight: 56, px: 2 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
              sx={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}
            >
              {project?.title ?? "Flight Tracker"} — Analytics
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: 14,
                    fontWeight: 700,
                  },
                }}
                control={
                  <Switch
                    checked={trailEnabled}
                    onChange={(e) => setTrailEnabled(e.target.checked)}
                  />
                }
                label={
                  <>
                    <span>Trail</span>
                    <Tooltip title={trailHelp} arrow>
                      <InfoOutlinedIcon
                        sx={{ fontSize: 18, opacity: 0.7, cursor: "help" }}
                      />
                    </Tooltip>
                  </>
                }
              />

              <FormControlLabel
                disabled
                sx={{
                  m: 0,
                  opacity: 0.65,
                  "& .MuiFormControlLabel-label": {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: 14,
                    fontWeight: 700,
                  },
                }}
                control={<Switch checked={false} disabled />}
                label={
                  <>
                    <span>Exact</span>
                    <Tooltip title={exactHelp} arrow>
                      <InfoOutlinedIcon
                        sx={{ fontSize: 18, opacity: 0.7, cursor: "help" }}
                      />
                    </Tooltip>
                  </>
                }
              />
            </Box>

            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="medium"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: RADIUS,
                textTransform: "none",
                fontWeight: 800,
                px: 2,
              }}
            >
              Back to portfolio
            </Button>
          </Toolbar>
        ) : (
          <Toolbar
            sx={{
              minHeight: 48,
              px: 1.5,
              py: 1,
              position: "relative",
            }}
          >
            <IconButton
              component={Link}
              href="/"
              aria-label="Back"
              sx={{
                position: "absolute",
                left: 8,
                top: "80%",
                transform: "translateY(-50%)",
              }}
            >
              <ArrowBackIcon fontSize="large" />
            </IconButton>

            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
              sx={{ width: "100%", textAlign: "center", lineHeight: 1.1 }}
            >
              {project?.title ?? "Flight Tracker"}
            </Typography>
          </Toolbar>
        )}

        <Tabs
          value={view}
          onChange={(_, v: ViewKey) => setView(v)}
          textColor="inherit"
          indicatorColor="primary"
          variant={isMdUp ? "standard" : "fullWidth"}
          sx={{
            px: 2,
            minHeight: { xs: 34, md: 40 },
            "& .MuiTabs-flexContainer": { gap: isMdUp ? 1 : 0 },
            "& .MuiTab-root": {
              width: isMdUp ? TAB_WIDTH : "auto",
              minWidth: isMdUp ? TAB_WIDTH : 0,
              minHeight: { xs: 34, md: 40 },
              px: 1.25,
              py: { xs: 0.25, md: 0.75 },
              textTransform: "none",
              fontWeight: 600,
              letterSpacing: 0,
            },
            ...(isMdUp
              ? {}
              : {
                  "& .MuiTabs-indicator": {
                    width: "50% !important",
                    left: "25% !important",
                  },
                }),
          }}
        >
          <Tab value="map" label="Map" />
          {isMdUp && <Tab value="overview" label="Overview" />}
        </Tabs>
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {view === "map" ? (
          <Box sx={{ height: "100%", minHeight: 0, p: { xs: 0, md: 1.5 } }}>
            <Box
              sx={(t) => ({
                height: "100%",
                minHeight: 0,
                border: { xs: "none", md: `1px solid ${t.palette.divider}` },
                borderRadius: { xs: 0, md: 0 },
                overflow: "hidden",
                bgcolor: "background.paper",
                position: "relative",
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
