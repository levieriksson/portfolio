"use client";

import { Card, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import React from "react";

type StatCardProps = {
  label: React.ReactNode;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Typography variant="caption" color={theme.palette.text.secondary}>
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Card>
  );
}
