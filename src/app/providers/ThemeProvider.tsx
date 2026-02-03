"use client";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  theme?: "dark" | "light" | typeof darkTheme;
}

export const darkTheme = createTheme({
  palette: {
    mode: "dark",

    background: {
      default: "#0b0f14",
      paper: "#121821",
    },

    primary: {
      main: "#90caf9",
    },

    text: {
      primary: "#e6edf3",
      secondary: "#9da7b3",
      disabled: "#6b7280",
    },

    divider: "rgba(255,255,255,0.08)",
  },

  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },

  shape: {
    borderRadius: 12,
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    primary: {
      main: "#1976d2",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#555555",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  shape: {
    borderRadius: 12,
  },
});

export default function ThemeProvider({ children, theme = "dark" }: Props) {
  const selectedTheme =
    theme === "dark" ? darkTheme : theme === "light" ? lightTheme : theme;
  return (
    <MuiThemeProvider theme={selectedTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
