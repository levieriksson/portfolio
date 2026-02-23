"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import ThemeProvider, { darkTheme } from "@/app/providers/ThemeProvider";
import { BaseModal } from "@/app/components/ui/BaseModal";
import { getProject } from "@/data/projects";
import { FlightTrackerTabsShell } from "@/app/components/FlightTracker/shell/FlightTrackerTabsShell";

function getHistoryIdx(): number | null {
  if (typeof window === "undefined") return null;

  const state: unknown = window.history.state;
  if (!state || typeof state !== "object") return null;

  const rec = state as Record<string, unknown>;
  const idx = rec["idx"];

  return typeof idx === "number" ? idx : null;
}

function canGoBack(): boolean {
  if (typeof window === "undefined") return false;

  const idx = getHistoryIdx();
  if (idx !== null) return idx > 0;

  return window.history.length > 1;
}

export default function FlightTrackerModalRoute() {
  const router = useRouter();
  const project = getProject("flight-tracker");

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    if (!isMdUp) router.replace("/flight-tracker");
  }, [isMdUp, router]);

  const handleClose = useCallback(() => {
    if (canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  if (!isMdUp) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <BaseModal
        open
        onClose={handleClose}
        title={project?.title ?? "Flight Tracker"}
      >
        <FlightTrackerTabsShell variant="modal" />
      </BaseModal>
    </ThemeProvider>
  );
}
