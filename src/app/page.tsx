import Image from "next/image";
import styles from "./page.module.css";
import PortfolioCarousel from "./components/PortfolioCarousel";
import { Box, Typography } from "@mui/material";

export default function Home() {
  return (
    <main>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pt: 6,
          px: { xs: 2, md: 4 },
          pb: 6,

          background: `
            radial-gradient(circle at 20% 10%, rgba(255,255,255,0.10), transparent 60%),
            radial-gradient(circle at 80% 90%, rgba(0,150,255,0.05), transparent 70%),
            linear-gradient(180deg, #0c0e14, #10121a)
          `,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight={700} color="white">
            🚧 Portfolio under construction 🚧
          </Typography>
          <Typography variant="subtitle1" color="grey.300">
            Next.js + TypeScript + Vercel
          </Typography>
        </Box>

        <PortfolioCarousel />
      </Box>
    </main>
  );
}
