"use client";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const darkTheme = createTheme({
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

export default function ThemeProvider({ children }: Props) {
  return (
    <MuiThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
