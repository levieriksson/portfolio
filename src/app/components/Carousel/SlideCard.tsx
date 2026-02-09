"use client";

import React from "react";
import { Card, Box, Typography, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Project } from "@/lib/types";

export type SlideCardProps = {
  project: Project;
  isCenterSlide: boolean;
  swipeTo: (index: number) => void;
  slideIndex: number;
  onViewProject: (project: Project) => void;
};

export function SlideCard({
  project,
  isCenterSlide,
  swipeTo,
  slideIndex,
  onViewProject,
}: SlideCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        height: 500,
        display: "flex",
        flexDirection: "column",
        p: 3,
        borderRadius: 2,
        boxShadow: isCenterSlide
          ? "0 16px 48px rgba(0,0,0,0.1)"
          : "0 6px 20px rgba(0,0,0,0.2)",
        cursor: isCenterSlide ? "default" : "pointer",
        transform: isCenterSlide ? "scale(1)" : "scale(0.9)",
        transition: "transform 0.3s ease",
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.05)",
        backdropFilter: "blur(0px)",

        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)"
        }`,
        color: theme.palette.text.primary,
      }}
      onClick={() => {
        if (!isCenterSlide) swipeTo(slideIndex);
      }}
    >
      <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
        {project.title}
      </Typography>

      <Divider
        sx={{ width: "100%", mb: 2, borderColor: theme.palette.divider }}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {project.stats.map((stat, i) => (
          <Box
            key={i}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Typography variant="body1" fontWeight={500}>
              {stat.label}:
            </Typography>
            <Typography variant="body1">{stat.value}</Typography>
          </Box>
        ))}
      </Box>

      {isCenterSlide && (
        <Box sx={{ mt: "auto", width: "100%" }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onViewProject(project);
            }}
          >
            View project
          </Button>
        </Box>
      )}
    </Card>
  );
}
