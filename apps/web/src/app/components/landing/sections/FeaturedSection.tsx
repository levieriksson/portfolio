import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Divider,
  useMediaQuery,
} from "@mui/material";
import NextLink from "next/link";
import LaunchIcon from "@mui/icons-material/Launch";
import GitHubIcon from "@mui/icons-material/GitHub";
import Section from "../ui/Section";
import { LINKS } from "@/lib/links";
import { useTheme } from "@mui/material/styles";

export default function FeaturedSection() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Section id="featured" eyebrow="Featured project" title="FlightTracker">
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: { xs: 18, md: 20 } }}>
              Live flight tracker around Sweden — built end-to-end like a real
              product.
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
              OpenSky → ingestion job → PostgreSQL → ASP.NET Core API → Next.js
              UI with MapLibre.
            </Typography>
          </Box>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Stack spacing={1}>
              <Typography>Engineering wins</Typography>
              <Stack component="ul" sx={{ pl: 2, m: 0 }} spacing={0.75}>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Deployed on Azure (Linux App Service + PostgreSQL Flexible
                  Server, Sweden Central).
                </Typography>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Scheduled ingestion pipeline writing snapshots + derived
                  flight sessions to Postgres.
                </Typography>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Public API used by the portfolio site; built with clean
                  boundaries and shared libraries.
                </Typography>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  CI/CD with GitHub Actions and infrastructure as code (Bicep).
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography>User-facing features</Typography>
              <Stack component="ul" sx={{ pl: 2, m: 0 }} spacing={0.75}>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Interactive MapLibre map with a search sidebar and clickable
                  aircraft markers.
                </Typography>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Fast “active flights” queries based on last-known session
                  positions (no heavy scans).
                </Typography>
                <Typography component="li" sx={{ color: "text.secondary" }}>
                  Clear UI flows: select flight from list or map, see key stats,
                  and drill in further.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ pt: 1 }}
          >
            <Button
              variant="contained"
              component={NextLink}
              href={isMdUp ? LINKS.project : LINKS.projectFullScreen}
              endIcon={<LaunchIcon />}
            >
              Open project
            </Button>

            <Button
              variant="outlined"
              component="a"
              href={LINKS.repo}
              target="_blank"
              rel="noreferrer"
              startIcon={<GitHubIcon />}
            >
              View on GitHub
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Section>
  );
}
