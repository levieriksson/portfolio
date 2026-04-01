import { Box, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Props = {
  borderRadius: number;
  hour: string;
  sessions: number;
};

export function PeakHoursCard({ borderRadius, hour, sessions }: Props) {
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
          Peak hour (today)
        </Typography>

        <Tooltip title="Hour with the highest number of sessions today" arrow>
          <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateRows: "20px 52px 24px 44px",
          alignContent: "center",
          justifyItems: "center",
          textAlign: "center",
          rowGap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
            alignSelf: "end",
          }}
        >
          Peak time
        </Typography>

        <Box
          sx={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 32, sm: 42 },
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {hour}
          </Typography>
        </Box>

        <Box
          sx={{
            height: 24,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 500,
              color: "text.secondary",
              lineHeight: 1,
            }}
          >
            Today
          </Typography>
        </Box>

        <Box
          sx={{
            height: 44,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 500,
              color: "text.primary",
              lineHeight: 1,
            }}
          >
            {sessions.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            sessions/hour
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
