import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function RadarHeroVisual() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const rimGradient = isDark
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.78)}, ${alpha(
        theme.palette.secondary.main,
        0.78,
      )})`;

  const innerSurface = isDark ? theme.palette.background.paper : "#ffffff";

  const gridLine = alpha(theme.palette.text.primary, isDark ? 0.06 : 0.14);
  const ring1 = alpha(theme.palette.text.primary, isDark ? 0.1 : 0.2);
  const ring2 = alpha(theme.palette.text.primary, isDark ? 0.08 : 0.18);
  const crosshair = alpha(theme.palette.text.primary, isDark ? 0.08 : 0.16);

  const tintA = alpha(theme.palette.secondary.main, isDark ? 0.14 : 0.1);
  const tintB = alpha(theme.palette.primary.main, isDark ? 0.14 : 0.1);

  const blipFill = isDark
    ? theme.palette.secondary.main
    : theme.palette.secondary.dark || theme.palette.secondary.main;

  const blipBorder = isDark ? alpha("#ffffff", 0.22) : alpha("#0f172a", 0.22);

  return (
    <Box
      sx={{
        position: "relative",
        width: { xs: "100%", md: 360 },
        maxWidth: 420,
        aspectRatio: "1 / 1",
        mx: { xs: "auto", md: 0 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: rimGradient,
          p: 0.75,
          boxShadow: isDark
            ? `0 20px 60px ${alpha(theme.palette.primary.main, 0.12)}`
            : `0 24px 60px ${alpha("#000", 0.12)}`,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            bgcolor: innerSurface,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Surface shading + subtle tints */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 30% 20%, ${tintA} 0%, transparent 46%),
                radial-gradient(circle at 70% 75%, ${tintB} 0%, transparent 46%),
                radial-gradient(circle at 50% 50%, ${alpha(
                  theme.palette.text.primary,
                  isDark ? 0.0 : 0.06,
                )} 0%, transparent 60%),
                radial-gradient(circle at 50% 50%, ${alpha(
                  "#000",
                  isDark ? 0.0 : 0.08,
                )} 0%, transparent 70%)
              `,
              opacity: isDark ? 0.9 : 1,
            }}
          />

          {/* Grid */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(0deg, ${gridLine} 0px, ${alpha(
                  theme.palette.text.primary,
                  0,
                )} 1px, transparent 22px),
                repeating-linear-gradient(90deg, ${gridLine} 0px, ${alpha(
                  theme.palette.text.primary,
                  0,
                )} 1px, transparent 22px)
              `,
              opacity: isDark ? 0.9 : 0.85,
            }}
          />

          {/* Crosshair */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              bgcolor: crosshair,
              transform: "translateX(-0.5px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              bgcolor: crosshair,
              transform: "translateY(-0.5px)",
            }}
          />

          {/* Rings */}
          <Box
            sx={{
              position: "absolute",
              inset: "10%",
              borderRadius: "50%",
              border: `1px solid ${ring1}`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: "26%",
              borderRadius: "50%",
              border: `1px solid ${ring2}`,
            }}
          />

          {/* Blips */}
          {[
            { top: "28%", left: "58%" },
            { top: "62%", left: "38%" },
            { top: "48%", left: "72%" },
          ].map((p, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: p.top,
                left: p.left,
                width: 10,
                height: 10,
                borderRadius: 999,
                bgcolor: blipFill,
                border: `1px solid ${blipBorder}`,
                boxShadow: `
                  0 0 0 4px ${alpha(blipFill, isDark ? 0.14 : 0.1)},
                  0 0 20px ${alpha(blipFill, isDark ? 0.36 : 0.3)}
                `,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
