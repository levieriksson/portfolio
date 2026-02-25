"use client";

import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsActivityResponseDto } from "@/lib/types";

type Props = {
  title: string;
  help?: string;
  data: AnalyticsActivityResponseDto;
  tickLabel: (utcIso: string) => string;
};

export function ActivityCharts({ title, help, data, tickLabel }: Props) {
  const t = useTheme();

  const rows =
    data.buckets?.map((b) => ({
      startUtc: b.startUtc,
      sessionsSeen: b.sessionsSeen ?? 0,
      enteredSweden: b.enteredSweden ?? 0,
    })) ?? [];

  const totalSessionsSeen = rows.reduce((acc, r) => acc + r.sessionsSeen, 0);
  const totalEnteredSweden = rows.reduce((acc, r) => acc + r.enteredSweden, 0);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>

        {help ? (
          <Tooltip title={help} arrow>
            <InfoOutlinedIcon
              sx={{ fontSize: 18, opacity: 0.75, cursor: "help" }}
            />
          </Tooltip>
        ) : null}

        <Box sx={{ flex: 1 }} />

        <Typography
          variant="caption"
          sx={{ opacity: 0.75, whiteSpace: "nowrap" }}
        >
          Total: {totalSessionsSeen.toLocaleString()} • Entered:{" "}
          {totalEnteredSweden.toLocaleString()}
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="startUtc"
              tickFormatter={tickLabel}
              minTickGap={18}
            />
            <YAxis width={44} />
            <RechartsTooltip
              labelFormatter={(v) =>
                typeof v === "string" ? tickLabel(v) : String(v ?? "")
              }
              contentStyle={{
                background: t.palette.background.paper,
                border: `1px solid ${t.palette.divider}`,
                borderRadius: 8,
              }}
              labelStyle={{
                color: t.palette.text.secondary,
                marginBottom: 6,
              }}
              itemStyle={{
                color: t.palette.text.primary,
              }}
            />
            <Line
              type="monotone"
              dataKey="sessionsSeen"
              dot={false}
              name="Sessions seen"
            />
            <Line
              type="monotone"
              dataKey="enteredSweden"
              dot={false}
              name="Entered Sweden"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
