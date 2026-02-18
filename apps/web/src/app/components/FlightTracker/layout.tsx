import type { ReactNode } from "react";
import ThemeProvider from "@/app/providers/ThemeProvider";
import { darkTheme } from "@/app/providers/ThemeProvider";

export default function FlightTrackerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>;
}
