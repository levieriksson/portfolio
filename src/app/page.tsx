import Image from "next/image";
import styles from "./page.module.css";
import PortfolioCarousel from "./components/PortfolioCarousel";
import { Box, Typography } from "@mui/material";

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
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
            "& > .blob": {
              position: "absolute",
              borderRadius: "50%",
              filter: "blur(160px)",
              opacity: 0.65,
            },
          }}
        >
          <Box
            className="blob"
            sx={{
              width: 400,
              height: 400,
              background: "rgba(255,0,150,0.35)",
              top: "10%",
              left: "5%",
            }}
          />

          <Box
            className="blob"
            sx={{
              width: 500,
              height: 500,
              background: "rgba(0,200,255,0.3)",
              top: "50%",
              right: "10%",
            }}
          />

          <Box
            className="blob"
            sx={{
              width: 450,
              height: 450,
              background: "rgba(255,255,0,0.25)",
              top: "30%",
              left: "60%",
            }}
          />
        </Box>

        <Box
          sx={{ textAlign: "center", mb: 6, position: "relative", zIndex: 1 }}
        >
          <Typography variant="h3" fontWeight={700} color="white">
            🚧 Portfolio under construction 🚧
          </Typography>
          <Typography variant="subtitle1" color="grey.400">
            Next.js + TypeScript + Vercel
          </Typography>
        </Box>

        <PortfolioCarousel />
      </Box>
    </main>
  );
}
