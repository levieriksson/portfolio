import type { ReactNode } from "react";
import { PortfolioThemeProvider } from "@/theme/portfolioThemeProvider";

export default function PortfolioLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <PortfolioThemeProvider>
      {children}
      {modal}
    </PortfolioThemeProvider>
  );
}
