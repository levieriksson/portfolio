"use client";

import React, { useRef, useState } from "react";
import {
  StackedCarousel,
  ResponsiveContainer,
  StackedCarouselSlideProps,
} from "react-stacked-center-carousel";
import Fab from "@mui/material/Fab";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  Box,
  Typography,
  Card,
  Divider,
  Button,
  Dialog,
  useTheme,
} from "@mui/material";
import { BaseModal } from "./ui/BaseModal";
import { StatCard } from "./ui/StatCard";
import { Project, ProjectStat, projects } from "../../../data/projects";

export default function PortfolioCarousel() {
  const carouselRef = useRef<StackedCarousel | undefined>(undefined);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const theme = useTheme();
  const SlideComponent = React.memo(function Slide({
    data,
    dataIndex,
    isCenterSlide,
    swipeTo,
    slideIndex,
  }: StackedCarouselSlideProps) {
    const project = data[dataIndex] as Project;

    return (
      <Card
        sx={{
          width: "100%",
          height: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          borderRadius: 2,
          boxShadow: isCenterSlide
            ? "0 16px 48px rgba(0,0,0,0.35)"
            : "0 6px 20px rgba(0,0,0,0.2)",
          cursor: isCenterSlide ? "default" : "pointer",
          transform: isCenterSlide ? "scale(1)" : "scale(0.9)",
          transition: "transform 0.3s ease",
          bgcolor: "rgba(255,255,255,0.03)",
          color: theme.palette.text.primary,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          textAlign: "left",
          p: 3,
        }}
        onClick={() => {
          if (!isCenterSlide) swipeTo(slideIndex);
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ mb: 2, color: theme.palette.text.primary }}
        >
          {project.title}
        </Typography>
        <Divider
          sx={{ width: "100%", mb: 2, borderColor: theme.palette.divider }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {project.stats.map((stat: ProjectStat, i: number) => (
            <Box
              key={i}
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Typography
                variant="body1"
                fontWeight={500}
                color={theme.palette.text.primary}
              >
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
                setOpenProject(project);
              }}
              sx={{ color: theme.palette.primary.main }}
            >
              View project
            </Button>
          </Box>
        )}
      </Card>
    );
  });

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "relative",
        mt: 6,
      }}
    >
      <ResponsiveContainer
        carouselRef={carouselRef}
        render={(width, carouselRef) => (
          <StackedCarousel
            ref={carouselRef}
            slideComponent={SlideComponent}
            slideWidth={500}
            carouselWidth={width}
            data={projects}
            maxVisibleSlide={3}
            disableSwipe={false}
            customScales={[1, 0.85, 0.7]}
            transitionTime={500}
            fadeDistance={0.1}
          />
        )}
      />

      <Fab
        size="small"
        onClick={() => carouselRef.current?.goBack()}
        sx={{
          position: "absolute",
          left: -20,
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }}
      >
        <KeyboardArrowLeftIcon />
      </Fab>

      <Fab
        size="small"
        onClick={() => carouselRef.current?.goNext()}
        sx={{
          position: "absolute",
          right: -20,
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: "#1976d2",
          color: "#fff",
          "&:hover": { backgroundColor: "#115293" },
        }}
      >
        <KeyboardArrowRightIcon />
      </Fab>
      {openProject && (
        <BaseModal open={!!openProject} onClose={() => setOpenProject(null)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color={theme.palette.text.primary}
              >
                {openProject.title}
              </Typography>
              <Typography color={theme.palette.text.secondary}>
                Live overview and statistics
              </Typography>
            </Box>

            <Divider sx={{ borderColor: theme.palette.divider }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 3,
              }}
            >
              {openProject.stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </Box>
          </Box>
        </BaseModal>
      )}
    </Box>
  );
}
