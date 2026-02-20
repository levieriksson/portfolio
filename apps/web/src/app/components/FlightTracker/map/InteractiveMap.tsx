"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";

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

export default function InteractiveMap({
  height = "80vh",
  borderRadius = 0,
  showHeader = true,
  fitToken,
  debug = false,
  constraintsMode = "modal",
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);

  const [lastSnapshotUtc, setLastSnapshotUtc] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [items, setItems] = useState<MapActiveItem[]>([]);
  const itemsRef = useRef<MapActiveItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [visibleItems, setVisibleItems] = useState<MapActiveItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  // Selected aircraft highlight source update (halo/ring layers are added in useMapLibreMap)
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

  // Popup info box near selected aircraft
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
    return () => {
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
        sx={(t) => ({
          display: "flex",
          flex: 1,
          minHeight: 0,
          border: `1px solid ${t.palette.divider}`,
          borderRadius,
          overflow: "hidden",
        })}
      >
        <MapSearchPanel
          items={items}
          selectedId={selectedId}
          onSelect={selectItem}
          width={320}
        />

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Box
            ref={elRef}
            sx={{
              height: "100%",
              width: "100%",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
