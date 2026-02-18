"use client";

import { Box, Container, Divider } from "@mui/material";
import LandingTopNav from "./LandingTopNav";
import HeroSection from "./sections/HeroSection";
import FeaturedSection from "./sections/FeaturedSection";
import ExperienceSection from "./sections/ExperienceSection";
import SkillsSection from "./sections/SkillsSection";
import AboutSection from "./sections/AboutSection";
import ContactSection from "./sections/ContactSection";

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <LandingTopNav />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <HeroSection />

        <Divider sx={{ my: { xs: 5, md: 7 } }} />
        <FeaturedSection />

        <Divider sx={{ my: { xs: 5, md: 7 } }} />
        <ExperienceSection />

        <Divider sx={{ my: { xs: 5, md: 7 } }} />
        <SkillsSection />

        <Divider sx={{ my: { xs: 5, md: 7 } }} />
        <AboutSection />

        <Divider sx={{ my: { xs: 5, md: 7 } }} />
        <ContactSection />

        <Box sx={{ py: 4 }} />
      </Container>
    </Box>
  );
}
