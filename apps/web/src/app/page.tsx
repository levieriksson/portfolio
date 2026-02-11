import Image from "next/image";
import styles from "./page.module.css";
import PortfolioCarousel from "./components/Carousel/PortfolioCarousel";
import { Box, Typography, keyframes } from "@mui/material";
import { AnimatedBlobs } from "./components/ui/AnimatedBlobs";
import ProjectAutoLauncher from "./components/ProjectAutoLauncher";

export default function Home() {
  return (
    <main>
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pt: 6,
          px: { xs: 2, md: 4 },
          pb: 6,
          background: "#0b0c14",
          overflow: "hidden",
        }}
      >
        <ProjectAutoLauncher />
        <AnimatedBlobs></AnimatedBlobs>

        <Box
          sx={{ textAlign: "center", mb: 6, position: "relative", zIndex: 1 }}
        >
          <Typography variant="h3" fontWeight={400} color="white">
            🚧 Under construction 🚧
          </Typography>
        </Box>

        <PortfolioCarousel />
      </Box>
    </main>
  );
}
