"use client";

import { Card, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import React from "react";

type StatCardProps = {
  label: React.ReactNode;
  value: string | number;
  onClick?: () => void;
  clickable?: boolean;
  borderRadius?: number;
};

export function StatCard({
  label,
  value,
  onClick,
  clickable,
  borderRadius = 1,
}: StatCardProps) {
  const theme = useTheme();
  const isClickable = clickable ?? Boolean(onClick);

  return (
    <Card
      elevation={0}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      sx={{
        p: 2,
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius,
        border: "1px solid",
        borderColor: "divider",
        cursor: isClickable ? "pointer" : "default",
        userSelect: "none",
        transition: "transform 120ms ease, border-color 120ms ease",
        "&:hover": isClickable
          ? {
              transform: "translateY(-1px)",
              borderColor: alpha(theme.palette.text.primary, 0.22),
            }
          : undefined,
        "&:focus-visible": isClickable
          ? {
              outline: `2px solid ${alpha(theme.palette.text.primary, 0.25)}`,
              outlineOffset: 2,
            }
          : undefined,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="h5">{value}</Typography>

      {isClickable && (
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, display: "block", mt: 0.5 }}
        >
          Click to browse
        </Typography>
      )}
    </Card>
  );
}
