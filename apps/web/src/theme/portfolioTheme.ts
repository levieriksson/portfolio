import { createTheme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

const fontFamily = "var(--font-geist-sans), sans-serif";

export function createPortfolioTheme(mode: ColorMode) {
  const isDark = mode === "dark";

  const palette = isDark
    ? {
        mode,
        background: {
          default: "#0b0f14",
          paper: "#0f1722",
        },
        primary: { main: "#6ea8ff" },
        secondary: { main: "#22d3ee" },
        success: { main: "#34d399" },
        text: {
          primary: "#e6edf3",
          secondary: "#9da7b3",
        },
        divider: "rgba(255,255,255,0.08)",
      }
    : {
        mode,
        background: {
          default: "#f7f8fb",
          paper: "#ffffff",
        },
        primary: { main: "#2f5bff" },
        secondary: { main: "#06b6d4" },
        success: { main: "#16a34a" },
        text: {
          primary: "#0f172a",
          secondary: "#334155",
        },
        divider: "rgba(15,23,42,0.10)",
      };

  return createTheme({
    palette,
    typography: {
      fontFamily,
      h1: { fontWeight: 500, letterSpacing: "-0.6px", lineHeight: 1.05 },
      h2: { fontWeight: 550, letterSpacing: "-0.4px", lineHeight: 1.15 },
      h3: { fontWeight: 600, letterSpacing: "-0.3px", lineHeight: 1.2 },
      h4: { fontWeight: 600, lineHeight: 1.25 },
      h5: { fontWeight: 600, lineHeight: 1.3 },
      h6: { fontWeight: 600, lineHeight: 1.35 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: "smooth",
          },
          body: {
            colorScheme: mode,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 20,
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(15,23,42,0.08)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
          contained: {
            boxShadow: "none",
          },
        },
      },
    },
  });
}
