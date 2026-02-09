"use client";

import { useRouter } from "next/navigation";
import { BaseModal } from "@/app/components/ui/BaseModal";
import { FlightTrackerLiveOverview } from "@/app/components/FlightTracker/LiveOverview";

export default function FlightTrackerModalRoute() {
  const router = useRouter();

  return (
    <BaseModal open onClose={() => router.back()}>
      <FlightTrackerLiveOverview />
    </BaseModal>
  );
}
