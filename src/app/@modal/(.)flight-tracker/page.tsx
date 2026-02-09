"use client";

import { useRouter } from "next/navigation";
import { BaseModal } from "@/app/components/ui/BaseModal";
import { FlightTrackerLiveOverview } from "@/app/components/FlightTracker/LiveOverview";
import { getProject } from "@/data/projects";

export default function FlightTrackerModalRoute() {
  const router = useRouter();
  const project = getProject("flight-tracker");

  return (
    <BaseModal
      open
      onClose={() => router.back()}
      title={project?.title ?? "Flight Tracker"}
      subtitle={project?.subtitle ?? "Live flight stats"}
    >
      <FlightTrackerLiveOverview />
    </BaseModal>
  );
}
