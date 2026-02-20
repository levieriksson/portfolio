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

export function MapToolbar({
  trailEnabled,
  onTrailEnabledChange,
  exactMode,
  onExactModeChange,
}: Props) {
  const trailHelp =
    "Trail: shows the recent path of the selected aircraft (e.g. last ~60 minutes).";
  const exactHelp =
    "Exact mode: only show aircraft strictly inside Sweden (future: polygon boundary). Off = nearby tracking area.";

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

      <Tooltip title={trailHelp} arrow>
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
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="caption">Trail</Typography>
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
              onChange={(e) => onExactModeChange(e.target.checked)}
            />
          }
          label={
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="caption">Exact</Typography>
              <InfoOutlinedIcon sx={{ fontSize: 16, opacity: 0.7 }} />
            </Box>
          }
        />
      </Tooltip>
    </Box>
  );
}
