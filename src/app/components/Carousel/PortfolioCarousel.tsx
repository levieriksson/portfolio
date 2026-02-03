"use client";

import React, { useRef, useState, RefObject } from "react";
import {
  StackedCarousel,
  ResponsiveContainer,
  StackedCarouselSlideProps,
} from "react-stacked-center-carousel";
import Fab from "@mui/material/Fab";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Box, Divider, useTheme } from "@mui/material";
import { BaseModal } from "../ui/BaseModal";
import { StatCard } from "../ui/StatCard";
import { Project, projects } from "../../../../data/projects";
import { SlideCard } from "./SlideCard";
import { FlightTrackerLiveOverview } from "../FlightTracker/LiveOverview";

export default function PortfolioCarousel() {
  const carouselRef = useRef<StackedCarousel>();
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const theme = useTheme();

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
        render={(width) => (
          <StackedCarousel
            ref={carouselRef}
            slideComponent={(props: StackedCarouselSlideProps) => (
              <SlideCard
                project={projects[props.dataIndex]}
                isCenterSlide={props.isCenterSlide}
                swipeTo={props.swipeTo}
                slideIndex={props.slideIndex}
                onViewProject={setOpenProject}
              />
            )}
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
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          "&:hover": { backgroundColor: theme.palette.text.disabled },
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
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          "&:hover": { backgroundColor: theme.palette.text.disabled },
        }}
      >
        <KeyboardArrowRightIcon />
      </Fab>

      {openProject && (
        <BaseModal open={!!openProject} onClose={() => setOpenProject(null)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <h2 style={{ margin: 0 }}>{openProject.title}</h2>
              <p style={{ margin: 0, color: theme.palette.text.secondary }}>
                Live overview and statistics
              </p>
            </Box>

            <Divider sx={{ borderColor: theme.palette.divider }} />

            {openProject.title.toLowerCase().includes("flight") ? (
              <FlightTrackerLiveOverview />
            ) : (
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
            )}
          </Box>
        </BaseModal>
      )}
    </Box>
  );
}
