"use client";

import { Box } from "@mui/material";
import InteractiveMap from "@/app/components/FlightTracker/map/InteractiveMap";
import type { FlightTrackerShellVariant } from "../FlightTrackerTabsShell";

type Props = {
  variant: FlightTrackerShellVariant;
  trailEnabled: boolean;
  exactMode: boolean;
  fitToken: number;
};

export function MapPanel({
  variant,
  trailEnabled,
  exactMode,
  fitToken,
}: Props) {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        p: variant === "page" ? { xs: 0, md: 1.5 } : 0,
      }}
    >
      <Box
        sx={(t) => ({
          height: "100%",
          minHeight: 0,
          border:
            variant === "page"
              ? { xs: "none", md: `1px solid ${t.palette.divider}` }
              : `1px solid ${t.palette.divider}`,
          borderRadius: variant === "modal" ? 1 : 0,
          overflow: "hidden",
          bgcolor: "background.paper",
          position: "relative",
        })}
      >
        <InteractiveMap
          height="100%"
          borderRadius={variant === "modal" ? 1 : 0}
          showHeader={false}
          constraintsMode={variant === "page" ? "page" : "modal"}
          trailEnabled={trailEnabled}
          exactMode={exactMode}
          fitToken={fitToken}
        />
      </Box>
    </Box>
  );
}
