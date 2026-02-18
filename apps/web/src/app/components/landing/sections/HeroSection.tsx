"use client";

import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { alpha, useTheme } from "@mui/material/styles";

import RadarHeroVisual from "../ui/RadarHeroVisual";

const LINKS = {
  github: "https://github.com/<your-handle>",
  linkedin: "https://www.linkedin.com/in/<your-handle>/",
  email: "mailto:levieriksson@hotmail.com",
};

type TargetId = "featured" | "contact";

export default function HeroSection() {
  const theme = useTheme();

  const iconButtonSx = {
    width: 56,
    height: 56,
    fontSize: 26,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 2.5,
    transition: "transform 120ms ease, border-color 120ms ease",
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: alpha(theme.palette.primary.main, 0.35),
    },
  } as const;

  const onScrollTo =
    (id: TargetId) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

  return (
    <Box
      sx={{
        position: "relative",
        py: { xs: 6, md: 8 },
        minHeight: { xs: "auto", md: "60vh" },
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(circle at 70% 20%, ${alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.18 : 0.3,
            )} 0%, transparent 68%),
            radial-gradient(circle at 85% 55%, ${alpha(
              theme.palette.secondary.main,
              theme.palette.mode === "dark" ? 0.16 : 0.24,
            )} 0%, transparent 74%)
          `,
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 4, md: 4 }}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ position: "relative" }}
      >
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 760 }}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 1.2, opacity: 0.8 }}
          >
            Hello<span style={{ color: theme.palette.primary.main }}>.</span>
          </Typography>

          <Typography
            variant="h1"
            sx={{
              mt: 1,
              letterSpacing: "-0.2px",
              lineHeight: 1.05,
              fontSize: { xs: 40, md: 56 },
            }}
          >
            Full-stack developer{" "}
            <Box component="span" sx={{ color: "text.secondary" }}>
              with a frontend focus
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 2.25,
              color: "text.secondary",
              fontSize: { xs: 16, md: 18 },
              maxWidth: 720,
            }}
          >
            Building React/Next.js UIs — with production-ready APIs, data, and
            deployment.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 4.25 }}
          >
            <Button
              variant="contained"
              size="large"
              component="a"
              href="#featured"
              onClick={onScrollTo("featured")}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ borderRadius: 2 }}
            >
              View FlightTracker
            </Button>

            <Button
              variant="outlined"
              size="large"
              component="a"
              href="#contact"
              onClick={onScrollTo("contact")}
              sx={{ borderRadius: 2 }}
            >
              Contact
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 2.25 }}>
            <Tooltip title="GitHub" arrow>
              <IconButton
                size="large"
                component="a"
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
                sx={iconButtonSx}
                aria-label="GitHub"
              >
                <GitHubIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            <Tooltip title="LinkedIn" arrow>
              <IconButton
                size="large"
                component="a"
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                sx={iconButtonSx}
                aria-label="LinkedIn"
              >
                <LinkedInIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Email" arrow>
              <IconButton
                size="large"
                component="a"
                href={LINKS.email}
                sx={iconButtonSx}
                aria-label="Email"
              >
                <EmailIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <RadarHeroVisual />
      </Stack>
    </Box>
  );
}
