"use client";

import React, { useRef } from "react";
import {
  StackedCarousel,
  ResponsiveContainer,
  StackedCarouselSlideProps,
} from "react-stacked-center-carousel";
import Fab from "@mui/material/Fab";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Box, Typography, Card, Divider } from "@mui/material";

type ProjectStat = {
  label: string;
  value: string;
};

type Project = {
  title: string;
  stats: ProjectStat[];
};

const projects: Project[] = [
  {
    title: "Flight Tracker",
    stats: [
      { label: "Current Flights", value: "123 in Sweden" },
      { label: "Highest Altitude", value: "12,000 m" },
      { label: "Average Delay", value: "5 min" },
    ],
  },
  {
    title: "Weather App",
    stats: [
      { label: "Location", value: "Stockholm" },
      { label: "Temp", value: "-4°C" },
      { label: "Humidity", value: "72%" },
    ],
  },
  {
    title: "Todo App",
    stats: [
      { label: "Tasks Today", value: "7" },
      { label: "Completed", value: "4" },
      { label: "Overdue", value: "1" },
    ],
  },
];

export default function PortfolioCarousel() {
  const carouselRef = useRef<StackedCarousel | undefined>(undefined);

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
          borderRadius: 3,
          boxShadow: isCenterSlide
            ? "0 16px 48px rgba(0,0,0,0.35)"
            : "0 6px 20px rgba(0,0,0,0.2)",
          cursor: isCenterSlide ? "default" : "pointer",
          transform: isCenterSlide ? "scale(1)" : "scale(0.9)",
          transition: "transform 0.3s ease",
          bgcolor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          textAlign: "left",
          p: 3,
        }}
        onClick={() => {
          if (!isCenterSlide) swipeTo(slideIndex);
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          {project.title}
        </Typography>
        <Divider sx={{ width: "100%", mb: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {project.stats.map((stat: ProjectStat, i: number) => (
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
          backgroundColor: "#1976d2",
          color: "#fff",
          "&:hover": { backgroundColor: "#115293" },
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
    </Box>
  );
}
