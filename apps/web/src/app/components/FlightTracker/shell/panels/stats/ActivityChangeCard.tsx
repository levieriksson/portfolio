import { Box, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import SouthEastRoundedIcon from "@mui/icons-material/SouthEastRounded";

import type { AnalyticsChangeResponseDto } from "@/lib/types";

type Props = {
  data: AnalyticsChangeResponseDto;
  borderRadius: number;
};

export function ActivityChangeCard({ data, borderRadius }: Props) {
  const percent = data.percentChange;

  const changeColor =
    percent == null
      ? "text.primary"
      : percent > 0
        ? "success.main"
        : percent < 0
          ? "error.main"
          : "text.primary";

  const displayValue =
    percent == null ? "—" : `${percent > 0 ? "+" : ""}${percent}%`;

  const isPositive = percent != null && percent > 0;
  const isNegative = percent != null && percent < 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius,
        px: 2.5,
        py: 2,
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Activity change
        </Typography>

        <Tooltip
          title="Percentage change in sessions compared to the previous 24 hours"
          arrow
        >
          <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: 52, sm: 64 },
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: changeColor,
              }}
            >
              {displayValue}
            </Typography>

            {isPositive && (
              <NorthEastRoundedIcon
                sx={{
                  fontSize: 32,
                  color: changeColor,
                  opacity: 0.3,
                  mt: 0.5,
                }}
              />
            )}

            {isNegative && (
              <SouthEastRoundedIcon
                sx={{
                  fontSize: 32,
                  color: changeColor,
                  opacity: 0.3,
                  mt: 0.5,
                }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mt: "auto" }}>
          <Typography variant="body2" color="text.secondary">
            {data.currentSessions.toLocaleString()} vs{" "}
            {data.previousSessions.toLocaleString()} sessions (last 24h)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
