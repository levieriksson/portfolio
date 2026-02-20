"use client";

import NextLink from "next/link";
import {
  AppBar,
  Toolbar,
  Container,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import LaunchIcon from "@mui/icons-material/Launch";
import ThemeToggleButton from "./ui/ThemeToggleButton";
import { useTheme } from "@mui/material/styles";

type NavTarget = "featured" | "experience" | "skills" | "about" | "contact";

export default function LandingTopNav() {
  const theme = useTheme();

  const bg =
    theme.palette.mode === "dark"
      ? "rgba(15,23,34,0.72)"
      : "rgba(255,255,255,0.78)";

  const borderColor =
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.10)"
      : "rgba(15,23,42,0.12)";

  const onNavClick =
    (id: NavTarget) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

  return (
    <AppBar
      square
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: bg,
        color: "text.primary",
        backdropFilter: "blur(12px)",
        backgroundImage: "none",

        // override theme MuiPaper border/radius
        border: "none",
        borderRadius: 0,

        // keep only what we want
        borderBottom: "1px solid",
        borderColor,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, gap: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <FlightTakeoffIcon fontSize="small" />
            <Typography sx={{ whiteSpace: "nowrap" }}>Levi Eriksson</Typography>
            <Typography
              sx={{
                color: "text.secondary",
                display: { xs: "none", md: "block" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Full-stack (frontend-focused) • Stockholm (CET)
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Button
              size="small"
              component="a"
              href="#featured"
              onClick={onNavClick("featured")}
              sx={{ color: "text.primary" }}
            >
              Featured
            </Button>
            <Button
              size="small"
              component="a"
              href="#experience"
              onClick={onNavClick("experience")}
              sx={{ color: "text.primary" }}
            >
              Experience
            </Button>
            <Button
              size="small"
              component="a"
              href="#skills"
              onClick={onNavClick("skills")}
              sx={{ color: "text.primary" }}
            >
              Skills
            </Button>
            <Button
              size="small"
              component="a"
              href="#about"
              onClick={onNavClick("about")}
              sx={{ color: "text.primary" }}
            >
              About
            </Button>
            <Button
              size="small"
              component="a"
              href="#contact"
              onClick={onNavClick("contact")}
              sx={{ color: "text.primary" }}
            >
              Contact
            </Button>
          </Stack>

          <ThemeToggleButton />

          <Button
            size="small"
            variant="contained"
            component={NextLink}
            href="/flight-tracker-preview"
            endIcon={<LaunchIcon fontSize="small" />}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Open FlightTracker
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
