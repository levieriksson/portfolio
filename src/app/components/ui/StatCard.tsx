"use client";

import { Card, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color={theme.palette.text.secondary}>
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Card>
  );
}
