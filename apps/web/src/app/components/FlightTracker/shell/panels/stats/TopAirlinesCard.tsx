import { Box, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type { TopAirlinesResponseDto } from "@/lib/types";

type Props = {
  data: TopAirlinesResponseDto;
  borderRadius: number;
};

export function TopAirlinesCard({ data, borderRadius }: Props) {
  const maxCount = Math.max(...data.items.map((item) => item.sessionCount), 1);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius,
        px: 2,
        py: 1.75,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: 220,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Top airlines (24h)
        </Typography>

        <Tooltip
          title="Airlines with the most sessions in the last 24 hours"
          arrow
        >
          <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
        </Tooltip>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          px: 1,
          mt: "auto",
          mb: "auto",
        }}
      >
        {data.items.map((item, index) => {
          const width = (item.sessionCount / maxCount) * 100;
          const isTop = index === 0;

          return (
            <Box key={item.airlineCode}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.35,
                }}
              >
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 14 }}
                  >
                    {index + 1}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isTop ? 600 : 500,
                      color: isTop ? "text.primary" : "text.secondary",
                    }}
                  >
                    {item.airlineCode}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: isTop ? 600 : 500,
                    color: isTop ? "text.primary" : "text.secondary",
                  }}
                >
                  {item.sessionCount}
                </Typography>
              </Box>

              <Box
                sx={{
                  height: 6,
                  bgcolor: "action.hover",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${width}%`,
                    bgcolor: "text.secondary",
                    opacity: isTop ? 0.85 : 0.6,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
