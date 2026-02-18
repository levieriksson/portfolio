import { Paper, Stack, Typography } from "@mui/material";
import Section from "../ui/Section";

export default function AboutSection() {
  return (
    <Section id="about" eyebrow="About" title="About">
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={1.25} sx={{ maxWidth: 900 }}>
          <Typography sx={{ color: "text.secondary" }}>
            Frontend-focused full-stack developer. I ship React/Next.js features
            and can own the backend + deployment path when required. Current
            flagship project: FlightTracker (OpenSky → Postgres → API → Map,
            live on Azure).
          </Typography>

          <Typography sx={{ color: "text.secondary" }}>
            I value clear structure, small iterations, and getting features all
            the way into production.
          </Typography>
        </Stack>
      </Paper>
    </Section>
  );
}
