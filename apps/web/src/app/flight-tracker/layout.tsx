"use client";

import ThemeProvider, { darkTheme } from "@/app/providers/ThemeProvider";

export default function FlightTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>;
}
