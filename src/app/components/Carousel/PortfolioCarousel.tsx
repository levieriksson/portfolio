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
import { Box, Typography, useTheme } from "@mui/material";
import { BaseModal } from "../ui/BaseModal";
import { StatCard } from "../ui/StatCard";
import { Project } from "@/lib/types";
import { SlideCard } from "./SlideCard";
import { FlightTrackerLiveOverview } from "../FlightTracker/LiveOverview";
import { useRouter } from "next/navigation";
import { projects } from "@/data/projects";

export default function PortfolioCarousel() {
  const carouselRef = useRef<StackedCarousel | null>(null);

  const theme = useTheme();
  const router = useRouter();

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
        carouselRef={
          carouselRef as unknown as React.MutableRefObject<StackedCarousel>
        }
        render={(width) => (
          <StackedCarousel
            ref={carouselRef}
            slideComponent={(props: StackedCarouselSlideProps) => (
              <SlideCard
                project={projects[props.dataIndex]}
                isCenterSlide={props.isCenterSlide}
                swipeTo={props.swipeTo}
                slideIndex={props.slideIndex}
                onViewProject={(project) => router.push(project.route)}
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
    </Box>
  );
}
