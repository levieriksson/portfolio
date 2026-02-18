import { Box, Paper, Typography, Stack } from "@mui/material";
import Section from "../ui/Section";

export default function ExperienceSection() {
  const items = [
    {
      title: "Konvolo — Volunteer Software Developer",
      meta: "Dec 2024 – Present (part-time)",
      body: "Frontend + backend on a SaaS platform, fixing bugs and shipping features with the team.",
    },
    {
      title: "Konvolo — Software Developer Intern",
      meta: "Jun 2024 – Nov 2024",
      body: "React + Node.js work with GraphQL, MongoDB, and third-party integrations in an agile team.",
    },
    {
      title: "Shoppa AB — Team Lead / Application Specialist",
      meta: "2013 – 2022",
      body: "Led support operations, incident handling, and process improvements with strong ownership.",
    },
  ];

  return (
    <Section id="experience" eyebrow="Experience" title="Experience">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {items.map((x) => (
          <Paper key={x.title} sx={{ p: 2.5, height: "100%" }}>
            <Stack spacing={0.75}>
              <Typography>{x.title}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                {x.meta}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>{x.body}</Typography>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Section>
  );
}
