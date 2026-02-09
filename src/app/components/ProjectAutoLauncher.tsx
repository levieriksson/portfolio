"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProjectAutoLauncher() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const project = params.get("project");
    if (project === "flight-tracker") {
      router.replace("/flight-tracker");
    }
  }, [params, router]);

  return null;
}
