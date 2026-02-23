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
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getProject } from "@/data/projects";
import { FlightTrackerTabsShell } from "@/app/components/FlightTracker/shell/FlightTrackerTabsShell";

const RADIUS = 1;

export function FlightTrackerAnalyticsPage() {
  const project = getProject("flight-tracker");
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
          <Toolbar sx={{ minHeight: 52, px: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Box sx={{ width: 40 }} />

              <Typography
                variant="subtitle1"
                fontWeight={800}
                noWrap
                sx={{ flex: 1, textAlign: "center", lineHeight: 1.1 }}
              >
                {project?.title ?? "Flight Tracker"}
              </Typography>

              <IconButton
                component={Link}
                href="/"
                aria-label="Close"
                sx={{ mr: -0.5 }}
              >
                <CloseIcon fontSize="medium" />
              </IconButton>
            </Box>
          </Toolbar>
        )}
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <FlightTrackerTabsShell
          variant="page"
          defaultTab="map"
          trailEnabled={trailEnabled}
          exactMode={exactMode}
        />
      </Box>
    </Box>
  );
}
