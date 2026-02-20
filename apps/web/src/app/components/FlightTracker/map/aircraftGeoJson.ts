import type { FeatureCollection, Point } from "geojson";
import type { MapActiveItem } from "@/lib/types";

export type AircraftFeatureProps = Pick<
  MapActiveItem,
  | "id"
  | "icao24"
  | "callsign"
  | "alt"
  | "vel"
  | "trk"
  | "lastSeenUtc"
  | "inSweden"
> & {
  label: string;
};

export type AircraftFeatureCollection = FeatureCollection<
  Point,
  AircraftFeatureProps
>;

export function toAircraftFeatureCollection(
  items: MapActiveItem[] | undefined,
): AircraftFeatureCollection {
  const features: AircraftFeatureCollection["features"] = (items ?? [])
    .filter((i) => i.lon != null && i.lat != null)
    .map((i) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [i.lon as number, i.lat as number],
      },
      properties: {
        id: i.id,
        icao24: i.icao24,
        callsign: i.callsign,
        alt: i.alt,
        vel: i.vel,
        trk: i.trk,
        lastSeenUtc: i.lastSeenUtc,
        inSweden: i.inSweden,
        label: i.callsign?.trim() ? i.callsign.trim() : i.icao24,
      },
    }));

  return { type: "FeatureCollection", features };
}
