"use client";

import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  CircularProgress,
  InputAdornment,
  Paper,
  TableContainer,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import type { FlightsPage, FlightsPageItem } from "@/lib/types";

type FlightsBrowserProps = {
  initialDate: string;
  initialActiveOnly?: boolean;
  initialSearch?: string;
  pageSize?: number;
  onSelectSession: (id: number) => void;
};

function HeaderWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <Tooltip title={tip} arrow>
      <Box component="span" sx={{ cursor: "help" }}>
        {label}
      </Box>
    </Tooltip>
  );
}

function formatLastSeenSmartEn(utcIso: string): string {
  const d = new Date(utcIso);
  const now = new Date();

  const ymd = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(x);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  const dYmd = ymd(d);
  const todayYmd = ymd(now);

  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const yesterdayYmd = ymd(y);

  if (dYmd === todayYmd) return `Today ${time}`;
  if (dYmd === yesterdayYmd) return `Yesterday ${time}`;

  return `${dYmd} ${time}`;
}

function formatDuration(firstUtc: string, endUtc: string) {
  const a = new Date(firstUtc).getTime();
  const b = new Date(endUtc).getTime();
  const ms = Math.max(0, b - a);

  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function FlightsBrowser({
  initialDate,
  initialActiveOnly = false,
  initialSearch = "",
  pageSize = 15,
  onSelectSession,
}: FlightsBrowserProps) {
  const [date, setDate] = useState(initialDate);
  const [activeOnly, setActiveOnly] = useState(initialActiveOnly);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<FlightsPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setDate(initialDate);
    setPage(1);
  }, [initialDate]);

  useEffect(() => {
    setActiveOnly(initialActiveOnly);
    setPage(1);
  }, [initialActiveOnly]);

  useEffect(() => {
    setSearch(initialSearch);
    setDebouncedSearch(initialSearch.trim());
    setPage(1);
  }, [initialSearch]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const params = new URLSearchParams({
          date,
          page: String(page),
          pageSize: String(pageSize),
          sort: "lastSeenDesc",
        });

        if (activeOnly) params.set("activeOnly", "true");
        if (debouncedSearch) params.set("q", debouncedSearch);

        const res = await apiGet<FlightsPage>(
          `/api/flights?${params.toString()}`,
        );
        if (!mounted) return;

        setData(res);

        if (res.page !== page) {
          setPage(res.page);
          return;
        }

        const computedTotalPages = Math.max(
          1,
          Math.ceil(res.total / res.pageSize),
        );
        if (page > computedTotalPages) setPage(computedTotalPages);
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : "Failed to load flights");
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [date, page, pageSize, activeOnly, debouncedSearch]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const items = data?.items ?? [];

  const showingFrom =
    data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const showingTo =
    data && data.total > 0
      ? Math.min(data.total, (data.page - 1) * data.pageSize + items.length)
      : 0;

  const showSkeleton = loading && !data;

  const openNativePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;

    const withPicker = el as HTMLInputElement & {
      showPicker?: (this: HTMLInputElement) => void;
    };

    if (typeof withPicker.showPicker === "function") {
      withPicker.showPicker.call(el);
    } else {
      el.focus();
      el.click();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "240px 1fr auto" },
          gap: 1.75,
          alignItems: "center",
        }}
      >
        <TextField
          label="Date"
          type="date"
          size="small"
          value={date}
          inputRef={dateInputRef}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={openNativePicker}
                  edge="end"
                  sx={{ color: "text.secondary" }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& input[type='date']::-webkit-calendar-picker-indicator": {
              opacity: 0,
              display: "none",
            },
          }}
        />

        <TextField
          label="Search callsign / ICAO24"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControlLabel
          control={
            <Switch
              color="success"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(1);
              }}
            />
          }
          label="Active"
          sx={{ m: 0 }}
        />
      </Box>

      {err && (
        <Typography variant="body2" sx={{ color: "error.main" }}>
          Failed to load flights: {err}
        </Typography>
      )}

      <Paper
        variant="outlined"
        sx={{
          borderColor: "divider",
          borderRadius: 0,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <TableContainer
          sx={{
            minHeight: 420,
          }}
        >
          <Table
            size="small"
            sx={(theme) => ({
              "& th": {
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "0.02em",
                opacity: 0.85,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              },
              "& td": { fontWeight: 400, fontSize: 13 },
              "& th, & td": { py: 0.75, lineHeight: 1.3 },

              "& tbody tr:nth-of-type(odd)": {
                bgcolor: alpha(theme.palette.text.primary, 0.012),
              },

              "& tbody tr:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              },
            })}
          >
            <TableHead>
              <TableRow>
                <TableCell>Callsign</TableCell>
                <TableCell>ICAO24</TableCell>
                <TableCell>Last seen</TableCell>
                <TableCell>
                  <HeaderWithTip
                    label="Duration"
                    tip="Approx. time between first and last observation for this session."
                  />
                </TableCell>
                <TableCell align="right">
                  <HeaderWithTip
                    label="Samples"
                    tip="Number of position updates ingested for this session."
                  />
                </TableCell>
                <TableCell align="right">Max altitude</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {showSkeleton &&
                Array.from({ length: 9 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell sx={{ py: 0.75 }}>
                      <Skeleton width="60%" />
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Skeleton width="55%" />
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Skeleton width="70%" />
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Skeleton width="45%" />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.75 }}>
                      <Skeleton width="35%" />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.75 }}>
                      <Skeleton width="50%" />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.75 }}>
                      <Skeleton width="40%" />
                    </TableCell>
                  </TableRow>
                ))}

              {!showSkeleton &&
                items.map((row) => (
                  <FlightRow
                    key={row.id}
                    row={row}
                    onClick={() => onSelectSession(row.id)}
                  />
                ))}

              {!showSkeleton && data && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                      No flights match your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pt: 0.25,
          minHeight: 32,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {loading && <CircularProgress size={14} sx={{ opacity: 0.8 }} />}

          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {!data
              ? "Loading…"
              : data.total === 0
                ? "No matches"
                : `${showingFrom}–${showingTo} of ${data.total}`}
          </Typography>
        </Box>

        {data && totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={data.page}
            onChange={(_, p) => setPage(p)}
            size="small"
          />
        )}
      </Box>
    </Box>
  );
}

function FlightRow({
  row,
  onClick,
}: {
  row: FlightsPageItem;
  onClick: () => void;
}) {
  const callsign = row.callsign?.trim() || "—";
  const end = row.endUtc ?? row.lastSeenUtc;
  const duration = row.firstSeenUtc
    ? formatDuration(row.firstSeenUtc, end)
    : "—";
  const samples = row.snapshotCount ?? 0;
  const maxAlt =
    row.maxAltitude == null ? "—" : `${Math.round(row.maxAltitude)} m`;

  return (
    <TableRow hover onClick={onClick} sx={{ cursor: "pointer" }}>
      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 500 }}>
        {callsign}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap", opacity: 0.85 }}>
        {row.icao24}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {formatLastSeenSmartEn(row.lastSeenUtc)}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap", opacity: 0.9 }}>
        {duration}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap", opacity: 0.9 }}>
        {samples}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        {maxAlt}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: row.isActive ? "success.main" : "text.secondary",
          }}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
