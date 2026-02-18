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
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {skills.map((s) => (
          <Chip
            key={s}
            label={s}
            variant="outlined"
            sx={{ borderRadius: 999, mb: 1 }}
          />
        ))}
      </Stack>
    </Section>
  );
}
