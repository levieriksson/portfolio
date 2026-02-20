"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { createPortfolioTheme, type ColorMode } from "./portfolioTheme";

const STORAGE_KEY = "portfolio-color-mode";

type ModeSource = "system" | "user";

type State = {
  mode: ColorMode;
  source: ModeSource;
};

type Ctx = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const PortfolioThemeContext = createContext<Ctx | null>(null);

export function usePortfolioTheme() {
  const ctx = useContext(PortfolioThemeContext);
  if (!ctx)
    throw new Error(
      "usePortfolioTheme must be used within PortfolioThemeProvider",
    );
  return ctx;
}

function readPreferredMode(): State {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark")
    return { mode: stored, source: "user" };

  return { mode: "dark", source: "system" };
}

export function PortfolioThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ mode: "dark", source: "system" });

  useEffect(() => {
    const id = window.setTimeout(() => {
      setState(readPreferredMode());
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (state.source !== "user") return;

    localStorage.setItem(STORAGE_KEY, state.mode);
  }, [state.mode, state.source]);

  useEffect(() => {
    document.documentElement.style.colorScheme = state.mode;
  }, [state.mode]);

  const theme = useMemo(() => createPortfolioTheme(state.mode), [state.mode]);

  const value = useMemo<Ctx>(
    () => ({
      mode: state.mode,
      setMode: (mode) => setState({ mode, source: "user" }),
      toggleMode: () =>
        setState((s) => ({
          mode: s.mode === "dark" ? "light" : "dark",
          source: "user",
        })),
    }),
    [state.mode],
  );

  return (
    <PortfolioThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </PortfolioThemeContext.Provider>
  );
}

export default PortfolioThemeProvider;
