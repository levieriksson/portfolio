import { Paper, Stack, Typography, Button } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import Section from "../ui/Section";
import SocialIconTiles from "../ui/SocialIconTiles";
import { LINKS } from "@/lib/links";

export default function ContactSection() {
  return (
    <Section id="contact" eyebrow="Contact" title="Contact">
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Typography sx={{ color: "text.secondary" }}>
            Want to talk? The easiest way to reach me is GitHub, LinkedIn, or
            email.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              component="a"
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Button>

            <Button
              variant="outlined"
              startIcon={<LinkedInIcon />}
              component="a"
              href={LINKS.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </Button>

            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              component="a"
              href={LINKS.email}
            >
              Email
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Section>
  );
}
