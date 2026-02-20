import { Stack, Chip } from "@mui/material";
import Section from "../ui/Section";

export default function SkillsSection() {
  const skills = [
    "React",
    "Next.js",
    "TypeScript",
    "MUI",
    "C# / .NET",
    "ASP.NET Core",
    "PostgreSQL",
    "MongoDB",
    "Azure",
    "Docker",
    "GitHub Actions",
    "Bicep (IaC)",
  ];

  return (
    <Section id="skills" eyebrow="Stack" title="Skills">
      <Stack
        direction="row"
        sx={{
          flexWrap: "wrap",
          gap: 1,
          justifyContent: { xs: "center", sm: "flex-start" },
        }}
      >
        {skills.map((s) => (
          <Chip
            key={s}
            label={s}
            variant="outlined"
            sx={{ borderRadius: 999 }}
          />
        ))}
      </Stack>
    </Section>
  );
}
