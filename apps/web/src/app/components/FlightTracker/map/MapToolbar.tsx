"use client";

import {
  Box,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Props = {
  trailEnabled: boolean;
  onTrailEnabledChange: (v: boolean) => void;

  exactMode: boolean;
  onExactModeChange: (v: boolean) => void;
};

export function MapToolbar({ trailEnabled, onTrailEnabledChange }: Props) {
  const trailHelp =
    "Trail: shows the recent path of the selected aircraft (e.g. last ~60 minutes).";

  return (
    <Box
      sx={(t) => ({
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.25,
        py: 0.75,
        borderRadius: 1,
        border: "1px solid",
        borderColor: t.palette.divider,
        bgcolor: "rgba(15,18,24,0.65)",
        backdropFilter: "blur(10px)",
      })}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.9 }}>
        Controls
      </Typography>

      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            size="small"
            checked={trailEnabled}
            onChange={(e) => onTrailEnabledChange(e.target.checked)}
          />
        }
        label={
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption">Trail</Typography>
            <Tooltip title={trailHelp} arrow>
              <InfoOutlinedIcon
                sx={{ fontSize: 16, opacity: 0.7, cursor: "help" }}
              />
            </Tooltip>
          </Box>
        }
      />

      <FormControlLabel
        disabled
        sx={{ m: 0, opacity: 0.6 }}
        control={
          <Switch size="small" checked={false} onChange={() => {}} disabled />
        }
        label={
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption">Exact</Typography>
            <Tooltip
              title="Coming soon: polygon-based Sweden boundary (true Sweden-only)."
              arrow
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 16, opacity: 0.7, cursor: "help" }}
              />
            </Tooltip>
          </Box>
        }
      />
    </Box>
  );
}
