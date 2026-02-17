"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  OutlinedInput,
  Paper,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { MapActiveItem } from "@/lib/types";

type Props = {
  items: MapActiveItem[];
  selectedId: number | null;
  onSelect: (item: MapActiveItem) => void;
  width?: number;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function minutesAgoLabel(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  return `${mins} min ago`;
}

export function MapSearchPanel({
  items,
  selectedId,
  onSelect,
  width = 320,
}: Props) {
  const [q, setQ] = useState("");

  const nf = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    [],
  );

  const filtered = useMemo(() => {
    const nq = norm(q);

    const res = !nq
      ? items
      : items.filter((i) => {
          const callsign = i.callsign ? norm(i.callsign) : "";
          const icao24 = norm(i.icao24);

          const operator = i.aircraft?.operatorName
            ? norm(i.aircraft.operatorName)
            : "";
          const model = i.aircraft?.model ? norm(i.aircraft.model) : "";
          const typeCode = i.aircraft?.typeCode
            ? norm(i.aircraft.typeCode)
            : "";
          const reg = i.aircraft?.registration
            ? norm(i.aircraft.registration)
            : "";
          const manu = i.aircraft?.manufacturerName
            ? norm(i.aircraft.manufacturerName)
            : "";

          return (
            callsign.includes(nq) ||
            icao24.includes(nq) ||
            operator.includes(nq) ||
            model.includes(nq) ||
            typeCode.includes(nq) ||
            reg.includes(nq) ||
            manu.includes(nq)
          );
        });

    return [...res].sort(
      (a, b) => Date.parse(b.lastSeenUtc) - Date.parse(a.lastSeenUtc),
    );
  }, [items, q]);

  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        width,
        minWidth: width,
        maxWidth: width,
        height: "100%",
        borderRadius: 0,
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: t.palette.background.default,
      })}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Search
        </Typography>

        <OutlinedInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="callsign, icao24, operator, model…"
          fullWidth
          size="small"
          inputProps={{ autoComplete: "off" }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          }
          sx={(t) => ({
            borderRadius: 1,
            bgcolor: t.palette.background.paper,
            fontSize: 14,
            "& .MuiOutlinedInput-input": { py: 0.75 },
            "& input::placeholder": { opacity: 0.7 },
          })}
        />

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {filtered.length} of {items.length}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ overflow: "auto", flex: 1 }}>
        <List dense disablePadding>
          {filtered.slice(0, 200).map((i) => {
            const callsign = i.callsign?.trim() ? i.callsign.trim() : null;
            const reg = i.aircraft?.registration?.trim()
              ? i.aircraft.registration.trim()
              : null;

            const title = callsign ?? reg ?? i.icao24;

            const metaParts: string[] = [];
            if (i.aircraft?.operatorName)
              metaParts.push(i.aircraft.operatorName);
            if (i.aircraft?.typeCode) metaParts.push(i.aircraft.typeCode);
            if (i.aircraft?.model) metaParts.push(i.aircraft.model);

            const dataParts: string[] = [];
            dataParts.push(i.icao24);
            if (i.alt != null)
              dataParts.push(`${nf.format(Math.round(i.alt))} m`);
            if (i.vel != null)
              dataParts.push(`${nf.format(Math.round(i.vel * 3.6))} km/h`);

            const ago = minutesAgoLabel(i.lastSeenUtc);
            if (ago) dataParts.push(ago);

            return (
              <ListItemButton
                key={i.id}
                selected={selectedId === i.id}
                onClick={() => onSelect(i)}
                sx={{ px: 2, py: 1.1, alignItems: "flex-start" }}
              >
                <ListItemText
                  secondaryTypographyProps={{ component: "span" }}
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {title}
                    </Typography>
                  }
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.25,
                      }}
                    >
                      {metaParts.length > 0 && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                          noWrap
                        >
                          {metaParts.join(" • ")}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                        noWrap
                      >
                        {dataParts.join(" • ")}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}
