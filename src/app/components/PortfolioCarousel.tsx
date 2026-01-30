"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useEffect, useState, useCallback } from "react";

const projects = [
  { title: "Flight Tracker", description: "Track flights in real time" },
  { title: "Weather App", description: "Weather forecasts" },
  { title: "Todo App", description: "Task management" },
];

export default function PortfolioCarousel() {
  const cardWidth = 350;
  const cardHeight = 500;
  const sidePeek = 50;
  const viewportWidth = cardWidth + sidePeek * 2;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;

    const onInit = () => setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);

    onInit();
    onSelect();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: viewportWidth, overflow: "visible" }}>
        <Box ref={emblaRef} sx={{ overflow: "visible" }}>
          <Box sx={{ display: "flex", gap: 16 }}>
            {projects.map((p, i) => (
              <Box
                key={i}
                sx={{
                  flex: "0 0 auto",
                  width: cardWidth,
                  display: "flex",
                  justifyContent: "center",
                  transition: "transform 0.3s ease",
                  transform: selectedIndex === i ? "scale(1.05)" : "scale(0.9)",
                  zIndex: selectedIndex === i ? 1 : 0,
                }}
              >
                <Card
                  sx={{
                    width: "100%",
                    height: cardHeight,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(22px)",
                    WebkitBackdropFilter: "blur(22px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {p.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {p.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button fullWidth variant="contained">
                      Open
                    </Button>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 1.5 }}
        >
          {scrollSnaps.map((_, i) => (
            <Box
              key={i}
              component="button"
              onClick={() => scrollTo(i)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor:
                  selectedIndex === i ? "primary.main" : "grey.600",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
