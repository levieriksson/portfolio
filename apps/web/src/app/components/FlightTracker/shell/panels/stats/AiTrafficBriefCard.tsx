"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { apiPost } from "@/lib/api";
import type { AiTrafficBriefResponseDto } from "@/lib/types";

type Props = {
  borderRadius: number;
};

export function AiTrafficBriefCard({ borderRadius }: Props) {
  const [data, setData] = useState<AiTrafficBriefResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateBrief() {
    try {
      setLoading(true);
      setError(null);

      const res = await apiPost<AiTrafficBriefResponseDto>(
        "/api/ai/traffic-brief",
      );

      setData(res);
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  }

  const caveatText = data?.caveats?.join(" ");

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
      elevation={0}
      disableGutters
      sx={{
        bgcolor: "transparent",
        border: "1px solid",
        borderColor: "divider",
        borderRadius,
        "&:before": { display: "none" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 0.75,
          gap: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            flex: 1,
            minHeight: 48,
            px: 0,
            py: 0,
            "& .MuiAccordionSummary-content": {
              my: 0,
              minWidth: 0,
            },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                AI Traffic Brief
              </Typography>

              {caveatText && (
                <Tooltip title={caveatText} arrow>
                  <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
                </Tooltip>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" noWrap>
              {loading
                ? "Generating brief…"
                : data
                  ? data.headline
                  : "Generate a short AI summary of current traffic activity."}
            </Typography>
          </Box>
        </AccordionSummary>

        {loading && <CircularProgress size={18} />}

        <Button
          variant={data ? "outlined" : "contained"}
          size="small"
          onClick={generateBrief}
          disabled={loading}
          sx={{ flexShrink: 0 }}
        >
          {loading ? "Generating" : data ? "Refresh" : "Generate"}
        </Button>
      </Box>

      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.75 }}>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {!data && !loading && (
          <Typography variant="body2" color="text.secondary">
            The AI-generated traffic summary will appear here.
          </Typography>
        )}

        {data && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box component="ul" sx={{ pl: 2.5, my: 0 }}>
              {data.bullets.map((bullet) => (
                <li key={bullet}>
                  <Typography variant="body2">{bullet}</Typography>
                </li>
              ))}
            </Box>

            <Typography variant="caption" color="text.secondary">
              {data.source === "openai"
                ? "Generated with AI from live analytics"
                : "Generated from deterministic analytics fallback"}{" "}
              at{" "}
              {new Date(data.generatedAtUtc).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
