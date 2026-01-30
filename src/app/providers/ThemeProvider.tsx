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
      default: "#121212",
      paper: "rgba(255, 255, 255, 0.05)",
    },
    primary: {
      main: "#90caf9",
    },
  },
  typography: {
    fontFamily: "Geist, Geist Mono, sans-serif",
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
