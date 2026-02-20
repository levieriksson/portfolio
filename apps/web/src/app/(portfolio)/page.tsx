import { Suspense } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatedBlobs } from "../components/ui/AnimatedBlobs";
import PortfolioCarousel from "../components/Carousel/PortfolioCarousel";
import ProjectAutoLauncher from "../components/ProjectAutoLauncher";
import { PortfolioThemeProvider } from "@/theme/portfolioThemeProvider";
import LandingPage from "../components/landing/LandingPage";

export default function Page() {
  return (
    <PortfolioThemeProvider>
      <LandingPage />
    </PortfolioThemeProvider>
  );
}
