"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProjectAutoLauncher() {
  const router = useRouter();
  const params = useSearchParams();
  const project = params.get("project");

  useEffect(() => {
    if (project === "flight-tracker") {
      router.replace("/flight-tracker");
    }
  }, [project, router]);

  return null;
}
