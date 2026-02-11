"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";

import { apiGet } from "@/lib/api";
import type { MapActiveResponse } from "@/lib/types";

type AircraftProps = {
  id: number;
  label: string;
  alt: number | null;
  vel: number | null;
  trk: number | null;
  lastSeenUtc: string;
  inSweden: boolean;
};

type AircraftFC = FeatureCollection<Point, AircraftProps>;

type Props = {
  height?: number | string;
  borderRadius?: number;
  showHeader?: boolean;
  fitToken?: number;
  debug?: boolean;
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

function clampBbox(b: { w: number; s: number; e: number; n: number }) {
  const lonMin = Math.max(b.w, SWEDEN_BOUNDS[0][0]);
  const latMin = Math.max(b.s, SWEDEN_BOUNDS[0][1]);
  const lonMax = Math.min(b.e, SWEDEN_BOUNDS[1][0]);
  const latMax = Math.min(b.n, SWEDEN_BOUNDS[1][1]);
  return { lonMin, latMin, lonMax, latMax };
}

function hasSetData(x: unknown): x is { setData: (data: AircraftFC) => void } {
  if (!x || typeof x !== "object") return false;
  const rec = x as Record<string, unknown>;
  return typeof rec.setData === "function";
}
async function addSvgIcon(map: MLMap, name: string, url: string) {
  if (map.hasImage(name)) return;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch icon: ${url}`);
  const svgText = await res.text();

  const img = new Image();
  img.onload = () => {
    if (!map.hasImage(name)) {
      map.addImage(name, img, { sdf: true }); // allows icon-color
      map.triggerRepaint();
    }
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

// function addPlaneIcon(map: MLMap) {
//   if (map.hasImage("plane")) return;

//   const svg = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
//       <path fill="black" d="M60 30L36 24V10c0-2.2-1.8-4-4-4s-4 1.8-4 4v14L4 30v4l24 6v14l-7-2v4l11 4h0l11-4v-4l-7 2V40l24-6v-4z"/>
//     </svg>
//   `.trim();

//   const img = new Image();
//   img.onload = () => {
//     map.addImage("plane", img, { sdf: true });
//     map.triggerRepaint();
//   };
//   img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
// }

function viewIsInside(
  view: maplibregl.LngLatBounds,
  container: maplibregl.LngLatBounds,
) {
  return (
    view.getWest() >= container.getWest() &&
    view.getSouth() >= container.getSouth() &&
    view.getEast() <= container.getEast() &&
    view.getNorth() <= container.getNorth()
  );
}

export default function InteractiveMap({
  height = "80vh",
  borderRadius = 0,
  showHeader = true,
  fitToken,
  debug = false,
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  const [lastSnapshotUtc, setLastSnapshotUtc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastFitTokenRef = useRef<number | null>(null);
  const fitDebounceTimerRef = useRef<number | null>(null);
  const pendingFitRef = useRef(false);

  const baseFittedZoomRef = useRef<number | null>(null);

  const isFittingRef = useRef(false);

  const panUnlockedRef = useRef(false);

  const styleUrl = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STADIA_API_KEY;
    const base = "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json";
    return key ? `${base}?api_key=${encodeURIComponent(key)}` : base;
  }, []);

  const swedenPanBounds = useMemo(
    () =>
      new maplibregl.LngLatBounds(
        [SWEDEN_PAN_BOUNDS.west, SWEDEN_PAN_BOUNDS.south],
        [SWEDEN_PAN_BOUNDS.east, SWEDEN_PAN_BOUNDS.north],
      ),
    [],
  );

  const softPanBounds = useMemo(
    () =>
      new maplibregl.LngLatBounds(
        [SOFT_PAN_BOUNDS.west, SOFT_PAN_BOUNDS.south],
        [SOFT_PAN_BOUNDS.east, SOFT_PAN_BOUNDS.north],
      ),
    [],
  );

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
      baseFittedZoom: baseFittedZoomRef.current,
      panUnlocked: panUnlockedRef.current,
      isFitting: isFittingRef.current,
      maxBounds: mb ? (mb.toArray?.() ?? mb) : null,
    });
  };

  const containerHasSize = () => {
    const el = elRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 80 && r.height >= 80;
  };

  function applyBounds(
    map: MLMap,
    bounds: maplibregl.LngLatBounds,
    label: string,
  ) {
    map.setMaxBounds(bounds);
    dbg("maxBounds set", label);
  }

  function lockPanToSoftBounds(map: MLMap) {
    map.dragPan.disable();
    map.keyboard.disable();
    panUnlockedRef.current = false;
    applyBounds(map, softPanBounds, "softPanBounds");
  }

  function unlockPan(map: MLMap) {
    map.dragPan.enable();
    map.keyboard.enable();
    panUnlockedRef.current = true;
  }

  function updatePanMode(map: MLMap) {
    if (isFittingRef.current) return;

    const base = baseFittedZoomRef.current;
    if (base == null) return;

    const unlockAt = base + PAN_UNLOCK_ZOOM_DELTA;
    const z = map.getZoom();

    if (z < unlockAt) {
      if (panUnlockedRef.current)
        dbg("pan LOCK (back near start)", { z, unlockAt });
      lockPanToSoftBounds(map);
      return;
    }

    if (!panUnlockedRef.current) {
      dbg("pan UNLOCK (zoomed in)", { z, unlockAt });
      unlockPan(map);
    }

    const currentView = map.getBounds();
    const fitsSweden = viewIsInside(currentView, swedenPanBounds);

    if (fitsSweden) {
      applyBounds(map, swedenPanBounds, "swedenPanBounds");
    } else {
      applyBounds(
        map,
        softPanBounds,
        "softPanBounds (zoomed in, view too large)",
      );
    }
  }

  async function fetchAndUpdate(map: MLMap) {
    setError(null);

    const b = map.getBounds();
    const c = clampBbox({
      w: b.getWest(),
      s: b.getSouth(),
      e: b.getEast(),
      n: b.getNorth(),
    });

    if (c.lonMin > c.lonMax || c.latMin > c.latMax) {
      const src = map.getSource("aircraft");
      if (hasSetData(src))
        src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const bboxParam = `${c.lonMin},${c.latMin},${c.lonMax},${c.latMax}`;

    try {
      const json = await apiGet<MapActiveResponse>(
        `/api/map/active?bbox=${encodeURIComponent(bboxParam)}`,
      );

      setLastSnapshotUtc(json.lastSnapshotUtc);

      const features: AircraftFC["features"] = (json.items ?? [])
        .filter((i) => i.lon != null && i.lat != null)
        .map((i) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [i.lon as number, i.lat as number],
          },
          properties: {
            id: i.id,
            label: i.callsign?.trim() ? i.callsign.trim() : i.icao24,
            alt: i.alt,
            vel: i.vel,
            trk: i.trk,
            lastSeenUtc: i.lastSeenUtc,
            inSweden: i.inSweden,
          },
        }));

      const src = map.getSource("aircraft");
      if (hasSetData(src)) src.setData({ type: "FeatureCollection", features });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function scheduleFit(reason: string) {
    const map = mapRef.current;
    if (!map) return;

    pendingFitRef.current = true;
    dbg("scheduleFit", reason);

    if (fitDebounceTimerRef.current != null) {
      window.clearTimeout(fitDebounceTimerRef.current);
    }

    fitDebounceTimerRef.current = window.setTimeout(() => {
      const m = mapRef.current;
      if (!m) return;
      if (!pendingFitRef.current) return;

      if (!containerHasSize()) {
        dbg("fit blocked: container has no size yet", reason);
        return;
      }

      m.once("idle", () => {
        const mm = mapRef.current;
        if (!mm) return;
        if (!pendingFitRef.current) return;

        pendingFitRef.current = false;
        isFittingRef.current = true;

        dbg("fit running", reason);
        logState("before-fit");

        const fitBounds = new maplibregl.LngLatBounds(
          [FIT_VIEW.west, FIT_VIEW.south],
          [FIT_VIEW.east, FIT_VIEW.north],
        );

        lockPanToSoftBounds(mm);

        mm.stop();
        mm.resize();

        mm.fitBounds(fitBounds, { padding: 60, duration: 0, maxZoom: 6 });

        requestAnimationFrame(() => {
          if (!mapRef.current) return;

          const fitted = mm.getZoom();
          baseFittedZoomRef.current = fitted;

          mm.setMinZoom(fitted);

          isFittingRef.current = false;

          dbg("fit done", { fitted, unlockAt: fitted + PAN_UNLOCK_ZOOM_DELTA });
          logState("after-fit");

          updatePanMode(mm);
        });
      });
    }, FIT_DEBOUNCE_MS);
  }

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    dbg("creating map");

    const map = new maplibregl.Map({
      container: elRef.current,
      style: styleUrl,
      center: [16.5, 62.0],
      zoom: 4.0,
      attributionControl: { compact: true },
      renderWorldCopies: false,
      trackResize: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    lockPanToSoftBounds(map);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const onMoveEnd = () => void fetchAndUpdate(map);

    if (debug) {
      map.on("resize", () => logState("event: resize"));
      map.on("movestart", () => logState("event: movestart"));
      map.on("moveend", () => logState("event: moveend"));
      map.on("zoomend", () => logState("event: zoomend"));
    }

    map.on("zoomend", () => updatePanMode(map));

    map.on("load", async () => {
      dbg("map load");
      logState("on-load");

      await addSvgIcon(map, "plane", "/flight.svg");

      map.addSource("aircraft", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "aircraft",
        type: "symbol",
        source: "aircraft",
        layout: {
          "icon-image": "plane",
          "icon-size": 0.9,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,

          "icon-rotation-alignment": "map",
          "icon-rotate": ["coalesce", ["get", "trk"], 0],
        },
        paint: {
          "icon-color": "white",
          "icon-opacity": 0.95,
        },
      });

      void fetchAndUpdate(map);
      map.on("moveend", onMoveEnd);

      if (fitToken != null && fitToken > 0) {
        pendingFitRef.current = true;
        scheduleFit("map load (pending fitToken)");
      }
    });

    const ro = new ResizeObserver(() => {
      map.resize();
      logState("after-resize");

      if (pendingFitRef.current) {
        scheduleFit("resize while pending fit");
      }
    });

    ro.observe(elRef.current);
    mapRef.current = map;

    return () => {
      dbg("cleanup map");
      if (fitDebounceTimerRef.current != null)
        window.clearTimeout(fitDebounceTimerRef.current);
      ro.disconnect();
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, debug, softPanBounds, swedenPanBounds]);

  useEffect(() => {
    if (fitToken == null || fitToken <= 0) return;
    if (lastFitTokenRef.current === fitToken) return;

    lastFitTokenRef.current = fitToken;
    pendingFitRef.current = true;
    scheduleFit(`fitToken ${fitToken}`);
  }, [fitToken]);

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
            {error ? ` • ${error}` : ""}
          </Typography>
        </Box>
      )}

      <Box
        ref={elRef}
        sx={(t) => ({
          flex: 1,
          minHeight: 0,
          width: "100%",
          borderRadius,
          overflow: "hidden",
          border: `1px solid ${t.palette.divider}`,
          bgcolor: "background.paper",
        })}
      />
    </Box>
  );
}
