"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import ThemeProvider, { darkTheme } from "@/app/providers/ThemeProvider";
import { BaseModal } from "@/app/components/ui/BaseModal";
import { FlightTrackerLiveOverview } from "@/app/components/FlightTracker/LiveOverview";
import { getProject } from "@/data/projects";

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

  const handleClose = useCallback(() => {
    if (canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  return (
    <ThemeProvider theme={darkTheme}>
      <BaseModal
        open
        onClose={handleClose}
        title={project?.title ?? "Flight Tracker"}
        subtitle={project?.subtitle ?? "Live flight stats"}
      >
        <FlightTrackerLiveOverview />
      </BaseModal>
    </ThemeProvider>
  );
}
