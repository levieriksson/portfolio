"use client";

import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type FlightDetailsDrawerProps = {
  open: boolean;
  sessionId: number | null;
  onClose: () => void;
};

type FlightSessionDetails = {
  id: number;
  icao24: string;
  callsign: string | null;
  firstSeenUtc: string;
  lastSeenUtc: string;
  endUtc: string | null;
  isActive: boolean;
  snapshotCount: number;
  maxAltitude: number | null;
  closeReason: string | null;
};

function formatIsoLocalStockholm(utcIso: string): string {
  const d = new Date(utcIso);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return `${get("year")}-${get("month")}-${get("day")} ${time}`;
}

export function FlightDetailsDrawer({
  open,
  sessionId,
  onClose,
}: FlightDetailsDrawerProps) {
  const [data, setData] = useState<FlightSessionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!open || sessionId == null) return;
      setLoading(true);
      setErr(null);

      try {
        const res = await apiGet<FlightSessionDetails>(
          `/api/flights/${sessionId}`,
        );
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setErr(
          e instanceof Error ? e.message : "Failed to load flight details",
        );
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [open, sessionId]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={(_, __) => onClose()}
      sx={(theme) => ({
        zIndex: theme.zIndex.modal + 20,
        "& .MuiDrawer-paper": {
          zIndex: theme.zIndex.modal + 20,
          width: 420,
          bgcolor: "background.paper",
          color: "text.primary",
          borderLeft: "1px solid",
          borderColor: "divider",
        },
      })}
      ModalProps={{ keepMounted: true }}
    >
      <Box
        sx={{ p: 2, height: "100%" }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Flight details
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Loading details…
            </Typography>
          </Box>
        )}

        {err && (
          <Typography variant="body2" sx={{ color: "error.main" }}>
            Failed to load details: {err}
          </Typography>
        )}

        {!loading && !err && data && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data.callsign?.trim() || "—"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {data.icao24}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                label={data.isActive ? "Active" : "Inactive"}
                color={data.isActive ? "success" : "default"}
                variant={data.isActive ? "filled" : "outlined"}
                sx={{ borderRadius: 1, height: 22 }}
              />
            </Box>

            <Divider />

            <Typography variant="body2">
              <b>First seen:</b> {formatIsoLocalStockholm(data.firstSeenUtc)}
            </Typography>
            <Typography variant="body2">
              <b>Last seen:</b> {formatIsoLocalStockholm(data.lastSeenUtc)}
            </Typography>
            <Typography variant="body2">
              <b>End:</b>{" "}
              {data.endUtc ? formatIsoLocalStockholm(data.endUtc) : "—"}
            </Typography>

            <Divider />

            <Typography variant="body2">
              <b>Samples:</b> {data.snapshotCount}
            </Typography>
            <Typography variant="body2">
              <b>Max altitude:</b>{" "}
              {data.maxAltitude == null
                ? "—"
                : `${Math.round(data.maxAltitude)} m`}
            </Typography>
            <Typography variant="body2">
              <b>Close reason:</b> {data.closeReason ?? "—"}
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
