"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";

type Links = {
  github: string;
  linkedin: string;
  email: string;
};

type Item = {
  label: string;
  href: string;
  icon: React.ReactNode;
  subtitle: string;
};

export default function SocialIconTiles({ links }: { links: Links }) {
  const items: Item[] = [
    {
      label: "GitHub",
      href: links.github,
      icon: <GitHubIcon fontSize="large" />,
      subtitle: "Code & projects",
    },
    {
      label: "LinkedIn",
      href: links.linkedin,
      icon: <LinkedInIcon fontSize="large" />,
      subtitle: "Profile",
    },
    {
      label: "Email",
      href: links.email,
      icon: <EmailIcon fontSize="large" />,
      subtitle: "Reach out",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {items.map((x) => (
        <Paper
          key={x.label}
          component="a"
          href={x.href}
          target={x.href.startsWith("http") ? "_blank" : undefined}
          rel={x.href.startsWith("http") ? "noreferrer" : undefined}
          sx={{
            p: 2.25,
            textDecoration: "none",
            display: "block",
            transition: "transform 120ms ease, box-shadow 120ms ease",
            "&:hover": { transform: "translateY(-2px)" },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            {x.icon}
            <Stack spacing={0.25}>
              <Typography sx={{ color: "text.primary" }}>{x.label}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                {x.subtitle}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}
