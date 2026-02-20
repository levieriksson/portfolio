"use client";

import maplibregl, { Map as MLMap } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";

type FitView = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type BoundsBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type PanMode = "modal" | "page";

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.MutableRefObject<MLMap | null>;
  readyToken: number;
  fitToken?: number;
  debug?: boolean;

  mode?: PanMode;

  fitView: FitView;
  swedenPanBounds: BoundsBox;
  softPanBounds: BoundsBox;
  panUnlockZoomDelta: number;
  fitDebounceMs: number;

  onLogState?: (tag: string) => void;
};

const PAGE_MIN_ZOOM_DELTA = 0.25;

export function useFitAndPanConstraints({
  containerRef,
  mapRef,
  readyToken,
  fitToken,
  debug = false,
  mode = "modal",
  fitView,
  swedenPanBounds,
  softPanBounds,
  panUnlockZoomDelta,
  fitDebounceMs,
  onLogState,
}: Params) {
  const lastFitTokenRef = useRef<number | null>(null);
  const fitDebounceTimerRef = useRef<number | null>(null);
  const pendingFitRef = useRef(false);

  const baseFittedZoomRef = useRef<number | null>(null);
  const isFittingRef = useRef(false);
  const panUnlockedRef = useRef(false);

  const isPage = mode === "page";

  const dbg = (...args: unknown[]) => {
    if (!debug) return;
    console.log("[useFitAndPanConstraints]", ...args);
  };

  const swedenPanLngLatBounds = useMemo(
    () =>
      new maplibregl.LngLatBounds(
        [swedenPanBounds.west, swedenPanBounds.south],
        [swedenPanBounds.east, swedenPanBounds.north],
      ),
    [swedenPanBounds],
  );

  const softPanLngLatBounds = useMemo(
    () =>
      new maplibregl.LngLatBounds(
        [softPanBounds.west, softPanBounds.south],
        [softPanBounds.east, softPanBounds.north],
      ),
    [softPanBounds],
  );

  function containerHasSize() {
    const el = containerRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 80 && r.height >= 80;
  }

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

  function applyBounds(
    map: MLMap,
    bounds: maplibregl.LngLatBounds,
    label: string,
  ) {
    map.setMaxBounds(bounds);
    dbg("maxBounds set", label);
  }

  function lockPanToSoftBounds(map: MLMap) {
    if (isPage) {
      map.dragPan.enable();
      map.keyboard.enable();
      panUnlockedRef.current = true;
      applyBounds(map, softPanLngLatBounds, "softPanBounds(page)");
      return;
    }

    map.dragPan.disable();
    map.keyboard.disable();
    panUnlockedRef.current = false;
    applyBounds(map, softPanLngLatBounds, "softPanBounds");
  }

  function unlockPan(map: MLMap) {
    map.dragPan.enable();
    map.keyboard.enable();
    panUnlockedRef.current = true;

    if (isPage) {
      applyBounds(map, softPanLngLatBounds, "softPanBounds(page)");
    }
  }

  function updatePanMode(map: MLMap) {
    if (isPage) return;
    if (isFittingRef.current) return;

    const base = baseFittedZoomRef.current;
    if (base == null) return;

    const unlockAt = base + panUnlockZoomDelta;
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
    const fitsSweden = viewIsInside(currentView, swedenPanLngLatBounds);

    if (fitsSweden) {
      applyBounds(map, swedenPanLngLatBounds, "swedenPanBounds");
    } else {
      applyBounds(
        map,
        softPanLngLatBounds,
        "softPanBounds (zoomed in, view too large)",
      );
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
        onLogState?.("before-fit");

        const fitBounds = new maplibregl.LngLatBounds(
          [fitView.west, fitView.south],
          [fitView.east, fitView.north],
        );

        lockPanToSoftBounds(mm);

        mm.stop();
        mm.resize();

        mm.fitBounds(fitBounds, { padding: 60, duration: 0, maxZoom: 6 });

        requestAnimationFrame(() => {
          if (!mapRef.current) return;

          const fitted = mm.getZoom();
          baseFittedZoomRef.current = fitted;

          if (isPage) {
            mm.setMinZoom(Math.max(0, fitted - PAGE_MIN_ZOOM_DELTA));
            applyBounds(mm, softPanLngLatBounds, "softPanBounds(page)");
          } else {
            mm.setMinZoom(fitted);
          }

          isFittingRef.current = false;

          dbg("fit done", { fitted, unlockAt: fitted + panUnlockZoomDelta });
          onLogState?.("after-fit");

          updatePanMode(mm);
        });
      });
    }, fitDebounceMs);
  }

  useEffect(() => {
    if (readyToken <= 0) return;
    const map = mapRef.current;
    if (!map) return;

    lockPanToSoftBounds(map);

    if (isPage) return;

    const onZoomEnd = () => updatePanMode(map);
    map.on("zoomend", onZoomEnd);

    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [readyToken, mode]);

  useEffect(() => {
    if (fitToken == null || fitToken <= 0) return;
    if (lastFitTokenRef.current === fitToken) return;

    lastFitTokenRef.current = fitToken;
    pendingFitRef.current = true;
    scheduleFit(`fitToken ${fitToken}`);
  }, [fitToken]);

  useEffect(() => {
    if (readyToken <= 0) return;
    if (fitToken == null || fitToken <= 0) return;

    pendingFitRef.current = true;
    scheduleFit("map ready (pending fitToken)");
  }, [readyToken]);

  useEffect(() => {
    return () => {
      if (fitDebounceTimerRef.current != null) {
        window.clearTimeout(fitDebounceTimerRef.current);
      }
    };
  }, []);
}
