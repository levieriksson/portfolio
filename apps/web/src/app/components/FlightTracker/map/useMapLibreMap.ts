"use client";

import maplibregl, { Map as MLMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

async function addSvgIcon(map: MLMap, name: string, url: string) {
  if (map.hasImage(name)) return;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch icon: ${url}`);
  const svgText = await res.text();

  const img = new Image();
  img.onload = () => {
    if (!map.hasImage(name)) {
      map.addImage(name, img, { sdf: true });
      map.triggerRepaint();
    }
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  styleUrl: string;
  debug?: boolean;
};

type Result = {
  mapRef: React.MutableRefObject<MLMap | null>;
  readyToken: number;
  error: string | null;
};

export function useMapLibreMap({
  containerRef,
  styleUrl,
  debug,
}: Params): Result {
  const mapRef = useRef<MLMap | null>(null);
  const [readyToken, setReadyToken] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const dbg = (...args: unknown[]) => {
    if (!debug) return;
    console.log("[useMapLibreMap]", ...args);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (mapRef.current) return;

    dbg("creating map");

    const map = new maplibregl.Map({
      container: el,
      style: styleUrl,
      center: [16.5, 62.0],
      zoom: 4.0,
      attributionControl: { compact: true },
      renderWorldCopies: false,
      trackResize: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    map.on("load", async () => {
      try {
        dbg("map load");

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

        map.addSource("selected-aircraft", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer(
          {
            id: "selected-halo",
            type: "circle",
            source: "selected-aircraft",
            paint: {
              "circle-radius": 18,
              "circle-color": "rgba(255,255,255,0.10)",
              "circle-stroke-width": 0,
            },
          },
          "aircraft",
        );

        map.addLayer(
          {
            id: "selected-ring",
            type: "circle",
            source: "selected-aircraft",
            paint: {
              "circle-radius": 10,
              "circle-color": "rgba(255,255,255,0.00)",
              "circle-stroke-width": 2,
              "circle-stroke-color": "rgba(255,255,255,0.85)",
            },
          },
          "aircraft",
        );

        map.addSource("trail", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer(
          {
            id: "trail-line",
            type: "line",
            source: "trail",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "rgba(255,255,255,0.85)",
              "line-width": 2,
              "line-opacity": 0.9,
            },
          },
          "aircraft",
        );

        map.addSource("trail-points", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer(
          {
            id: "trail-points-circle",
            type: "circle",
            source: "trail-points",
            paint: {
              "circle-radius": 3,
              "circle-color": "rgba(255,255,255,0.9)",
              "circle-opacity": 0.95,
              "circle-stroke-width": 1,
              "circle-stroke-color": "rgba(0,0,0,0.35)",
            },
          },
          "aircraft",
        );

        setError(null);
        setReadyToken((t) => t + 1);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

    mapRef.current = map;

    return () => {
      dbg("cleanup map");
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef, styleUrl, debug]);

  return { mapRef, readyToken, error };
}
