"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  useMediaQuery,
  useTheme,
  ButtonBase,
} from "@mui/material";

import {
  toAircraftFeatureCollection,
  type AircraftFeatureCollection,
} from "./aircraftGeoJson";
import { apiGet } from "@/lib/api";
import type { MapActiveItem, MapActiveResponse } from "@/lib/types";
import { useMapLibreMap } from "./useMapLibreMap";
import { useFitAndPanConstraints } from "./useFitAndPanConstraints";
import { MapSearchPanel } from "./MapSearchPanel";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { buildSelectedAircraftPopupHtml } from "./selectedPopup";

type Props = {
  height?: number | string;
  borderRadius?: number;
  showHeader?: boolean;
  fitToken?: number;
  debug?: boolean;
  constraintsMode?: "modal" | "page";
  trailEnabled?: boolean;
  exactMode?: boolean;
};

const FIT_VIEW = {
  west: 1.494141,
  south: 54.136696,
  east: 27.685547,
  north: 69.733334,
};

const SWEDEN_BOUNDS: [[number, number], [number, number]] = [
  [10.0, 54.5],
  [26.5, 70.5],
];

const SWEDEN_PAN_BOUNDS = {
  west: 8.0,
  south: 53.5,
  east: 28.5,
  north: 72.0,
};

const SOFT_PAN_BOUNDS = {
  west: FIT_VIEW.west - 12,
  south: FIT_VIEW.south - 6,
  east: FIT_VIEW.east + 12,
  north: FIT_VIEW.north + 6,
};

const PAN_UNLOCK_ZOOM_DELTA = 0.6;
const FIT_DEBOUNCE_MS = 140;

function hasSetData(
  x: unknown,
): x is { setData: (data: AircraftFeatureCollection) => void } {
  if (!x || typeof x !== "object") return false;
  return typeof (x as { setData?: unknown }).setData === "function";
}

function hasSetDataAny(x: unknown): x is { setData: (data: unknown) => void } {
  if (!x || typeof x !== "object") return false;
  return typeof (x as { setData?: unknown }).setData === "function";
}

function swedenBboxParam() {
  const [min, max] = SWEDEN_BOUNDS;
  return `${min[0]},${min[1]},${max[0]},${max[1]}`;
}

function isItemInBounds(item: MapActiveItem, map: MLMap): boolean {
  if (item.lon == null || item.lat == null) return false;

  const b = map.getBounds();
  return (
    item.lon >= b.getWest() &&
    item.lon <= b.getEast() &&
    item.lat >= b.getSouth() &&
    item.lat <= b.getNorth()
  );
}

function kmhFromMs(v: number | null) {
  if (v == null) return null;
  return Math.round(v * 3.6);
}

function minutesAgoLabel(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  return `${mins} min ago`;
}

type TrailPointAny = unknown;

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry:
      | { type: "LineString"; coordinates: Array<[number, number]> }
      | { type: "Point"; coordinates: [number, number] };
    properties?: Record<string, unknown>;
  }>;
};

const EMPTY_FC: GeoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const TRAIL_MINUTES = 60;

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getLatLon(p: TrailPointAny): { lat: number; lon: number } | null {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const o = p as Record<string, unknown>;

  const lat = num(o["lat"] ?? o["latitude"] ?? o["Latitude"]);
  const lon = num(o["lon"] ?? o["lng"] ?? o["longitude"] ?? o["Longitude"]);

  if (lat == null || lon == null) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;

  return { lat, lon };
}

function pickPoints(res: unknown): TrailPointAny[] {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  const pts = r["points"] ?? r["Points"];
  return Array.isArray(pts) ? (pts as TrailPointAny[]) : [];
}

function buildTrailLineFC(
  points: TrailPointAny[],
  sessionId: number,
): GeoJsonFeatureCollection {
  const coords: Array<[number, number]> = [];
  for (const p of points) {
    const ll = getLatLon(p);
    if (!ll) continue;
    coords.push([ll.lon, ll.lat]);
  }

  if (coords.length < 2) return EMPTY_FC;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: { sessionId },
      },
    ],
  };
}

function buildTrailPointsFC(
  points: TrailPointAny[],
  sessionId: number,
): GeoJsonFeatureCollection {
  const feats: GeoJsonFeatureCollection["features"] = [];
  let i = 0;

  for (const p of points) {
    const ll = getLatLon(p);
    if (!ll) continue;

    feats.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [ll.lon, ll.lat] },
      properties: { sessionId, i: i++ },
    });
  }

  return { type: "FeatureCollection", features: feats };
}

export default function InteractiveMap({
  height = "80vh",
  borderRadius = 0,
  showHeader = true,
  fitToken,
  debug = false,
  constraintsMode = "modal",
  trailEnabled = false,
  exactMode = false,
}: Props) {
  void exactMode;
  const MOBILE_SEARCH_HEADER_H = 44;
  const MOBILE_SEARCH_HEADER_PT = 1;
  const elRef = useRef<HTMLDivElement | null>(null);
  const [lastSnapshotUtc, setLastSnapshotUtc] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [items, setItems] = useState<MapActiveItem[]>([]);
  const itemsRef = useRef<MapActiveItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [visibleItems, setVisibleItems] = useState<MapActiveItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const trailCacheRef = useRef(
    new Map<
      number,
      { line: GeoJsonFeatureCollection; pts: GeoJsonFeatureCollection }
    >(),
  );
  const trailReqSeqRef = useRef(0);

  const popupRef = useRef<maplibregl.Popup | null>(null);

  const styleUrl = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STADIA_API_KEY;
    const base = "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json";
    return key ? `${base}?api_key=${encodeURIComponent(key)}` : base;
  }, []);

  const {
    mapRef,
    readyToken,
    error: mapInitError,
  } = useMapLibreMap({
    containerRef: elRef,
    styleUrl,
    debug,
  });

  const dbg = (...args: unknown[]) => {
    if (!debug) return;
    console.log("[InteractiveMap]", ...args);
  };

  const logState = (tag: string) => {
    if (!debug) return;
    const map = mapRef.current;
    const el = elRef.current;
    if (!map || !el) return;

    const r = el.getBoundingClientRect();
    const c = map.getCenter();
    const z = map.getZoom();
    const b = map.getBounds();
    const mb = map.getMaxBounds?.();

    dbg(tag, {
      container: { w: Math.round(r.width), h: Math.round(r.height) },
      center: { lng: +c.lng.toFixed(5), lat: +c.lat.toFixed(5) },
      zoom: +z.toFixed(3),
      bounds: {
        west: +b.getWest().toFixed(4),
        south: +b.getSouth().toFixed(4),
        east: +b.getEast().toFixed(4),
        north: +b.getNorth().toFixed(4),
      },
      maxBounds: mb ? (mb.toArray?.() ?? mb) : null,
    });
  };

  useFitAndPanConstraints({
    containerRef: elRef,
    mapRef,
    readyToken,
    fitToken,
    debug,
    mode: constraintsMode,
    fitView: FIT_VIEW,
    swedenPanBounds: SWEDEN_PAN_BOUNDS,
    softPanBounds: SOFT_PAN_BOUNDS,
    panUnlockZoomDelta: PAN_UNLOCK_ZOOM_DELTA,
    fitDebounceMs: FIT_DEBOUNCE_MS,
    onLogState: logState,
  });

  const fetchAndUpdate = useCallback(async (map: MLMap) => {
    setFetchError(null);

    try {
      const json = await apiGet<MapActiveResponse>(
        `/api/map/active?bbox=${encodeURIComponent(swedenBboxParam())}`,
      );

      setLastSnapshotUtc(json.lastSnapshotUtc);

      const nextItems = json.items ?? [];
      setItems(nextItems);

      const fc = toAircraftFeatureCollection(nextItems);
      const src = map.getSource("aircraft");
      if (hasSetData(src)) src.setData(fc);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const setSourceData = useCallback(
    (sourceId: string, fc: GeoJsonFeatureCollection) => {
      const map = mapRef.current;
      if (!map) return;

      const src = map.getSource(sourceId);
      if (!hasSetDataAny(src)) return;

      src.setData(fc);
    },
    [mapRef],
  );

  const clearTrailAll = useCallback(() => {
    setSourceData("trail", EMPTY_FC);
    setSourceData("trail-points", EMPTY_FC);
  }, [setSourceData]);

  const selectItem = useCallback(
    (i: MapActiveItem) => {
      setSelectedId(i.id);

      const map = mapRef.current;
      if (!map) return;
      if (i.lon == null || i.lat == null) return;

      map.easeTo({
        center: [i.lon, i.lat],
        zoom: Math.max(map.getZoom(), 6.5),
        duration: 450,
      });
    },
    [mapRef],
  );

  const handleSelectFromPanel = useCallback(
    (i: MapActiveItem) => {
      selectItem(i);
      if (!isMdUp) setMobileSearchOpen(false);
    },
    [selectItem, isMdUp],
  );

  const selectedItem = useMemo(() => {
    if (selectedId == null) return null;
    return items.find((x) => x.id === selectedId) ?? null;
  }, [items, selectedId]);

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    logState("on-ready");
    void fetchAndUpdate(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToken, fetchAndUpdate]);

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    const updateVisible = () => {
      setVisibleItems(itemsRef.current.filter((i) => isItemInBounds(i, map)));
    };

    updateVisible();
    map.on("moveend", updateVisible);
    map.on("zoomend", updateVisible);

    return () => {
      map.off("moveend", updateVisible);
      map.off("zoomend", updateVisible);
    };
  }, [readyToken, mapRef]);

  useEffect(() => {
    if (selectedId == null) return;
    if (items.some((x) => x.id === selectedId)) return;
    setSelectedId(null);
  }, [items, selectedId]);

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    const onAircraftClick = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const idRaw = (f?.properties as Record<string, unknown> | undefined)?.id;
      const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
      if (!Number.isFinite(id)) return;

      const found = itemsRef.current.find((x) => x.id === id);
      if (found) {
        selectItem(found);
        return;
      }

      setSelectedId(id);
      map.easeTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: Math.max(map.getZoom(), 6.5),
        duration: 450,
      });
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", "aircraft", onAircraftClick);
    map.on("mouseenter", "aircraft", onEnter);
    map.on("mouseleave", "aircraft", onLeave);

    return () => {
      map.off("click", "aircraft", onAircraftClick);
      map.off("mouseenter", "aircraft", onEnter);
      map.off("mouseleave", "aircraft", onLeave);
    };
  }, [readyToken, mapRef, selectItem]);

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("selected-aircraft");
    if (!hasSetDataAny(src)) return;

    const i = selectedItem;
    if (!i || i.lon == null || i.lat == null) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [i.lon, i.lat] },
          properties: { id: i.id },
        },
      ],
    });
  }, [readyToken, mapRef, selectedItem]);

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    const i = selectedItem;

    if (!i || i.lon == null || i.lat == null) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    const callsign = i.callsign?.trim() ? i.callsign.trim() : null;
    const kmh = kmhFromMs(i.vel);
    const ago = minutesAgoLabel(i.lastSeenUtc);

    const parts: string[] = [];
    if (i.alt != null) parts.push(`${Math.round(i.alt).toLocaleString()} m`);
    if (kmh != null) parts.push(`${kmh} km/h`);
    if (ago) parts.push(ago);

    void callsign;
    void parts;

    const html = buildSelectedAircraftPopupHtml(i);

    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        className: "ft-map-popup",
        maxWidth: "280px",
      }).addTo(map);
    }

    popupRef.current.setLngLat([i.lon, i.lat]).setHTML(html);
  }, [readyToken, mapRef, selectedItem]);

  useEffect(() => {
    if (readyToken <= 0) return;

    if (!trailEnabled || selectedId == null) {
      trailReqSeqRef.current += 1;
      clearTrailAll();
      return;
    }

    const cached = trailCacheRef.current.get(selectedId);
    if (cached) {
      setSourceData("trail", cached.line);
      setSourceData("trail-points", cached.pts);
      return;
    }

    const seq = (trailReqSeqRef.current += 1);

    void (async () => {
      try {
        const res = await apiGet<unknown>(
          `/api/flights/${selectedId}/trail?minutes=${TRAIL_MINUTES}`,
        );

        if (trailReqSeqRef.current !== seq) return;

        const points = pickPoints(res);
        const fcLine = buildTrailLineFC(points, selectedId);
        const fcPts = buildTrailPointsFC(points, selectedId);

        trailCacheRef.current.set(selectedId, { line: fcLine, pts: fcPts });
        setSourceData("trail", fcLine);
        setSourceData("trail-points", fcPts);
      } catch {
        if (trailReqSeqRef.current !== seq) return;
        clearTrailAll();
      }
    })();
  }, [readyToken, selectedId, trailEnabled, clearTrailAll, setSourceData]);

  useEffect(() => {
    return () => {
      trailReqSeqRef.current += 1;
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, []);

  const combinedError = fetchError ?? mapInitError;

  return (
    <Box
      sx={{
        height,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showHeader && (
        <Box sx={{ px: 1, py: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {lastSnapshotUtc
              ? `Last snapshot: ${lastSnapshotUtc}`
              : "No snapshots yet"}
            {combinedError ? ` • ${combinedError}` : ""}
            {debug
              ? ` • flights: ${items.length} • visible: ${visibleItems.length}`
              : ""}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          border: { xs: "none", md: "1px solid" },
          borderColor: { xs: "transparent", md: "divider" },
          borderRadius: { xs: 0, md: borderRadius },
          overflow: "hidden",
          position: "relative",
          bgcolor: "background.paper",
        }}
      >
        {isMdUp && (
          <MapSearchPanel
            items={items}
            selectedId={selectedId}
            onSelect={handleSelectFromPanel}
            width={320}
          />
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Box ref={elRef} sx={{ height: "100%", width: "100%" }} />
        </Box>

        {!isMdUp && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                bgcolor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                pb: "env(safe-area-inset-bottom)",
              }}
            >
              <ButtonBase
                onClick={() => setMobileSearchOpen((v) => !v)}
                sx={{
                  width: "100%",
                  height: MOBILE_SEARCH_HEADER_H,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  pt: MOBILE_SEARCH_HEADER_PT,
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 4,
                    borderRadius: 999,
                    bgcolor: "text.disabled",
                  }}
                />
                <Typography
                  sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}
                >
                  Search
                </Typography>
              </ButtonBase>
            </Box>

            <Drawer
              anchor="bottom"
              variant="persistent"
              open={mobileSearchOpen}
              PaperProps={{
                sx: {
                  height: "70dvh",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  backgroundImage: "none",
                },
              }}
              ModalProps={{ keepMounted: true }}
            >
              <ButtonBase
                onClick={() => setMobileSearchOpen(false)}
                sx={{
                  width: "100%",
                  height: MOBILE_SEARCH_HEADER_H,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  pt: MOBILE_SEARCH_HEADER_PT,
                  gap: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 4,
                    borderRadius: 999,
                    bgcolor: "text.disabled",
                  }}
                />
                <Typography
                  sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}
                >
                  Search
                </Typography>
              </ButtonBase>

              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <MapSearchPanel
                  items={items}
                  selectedId={selectedId}
                  onSelect={handleSelectFromPanel}
                  width="100%"
                />
              </Box>
            </Drawer>
          </>
        )}
      </Box>
    </Box>
  );
}
