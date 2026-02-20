import type { MapActiveItem } from "@/lib/types";

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

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildSelectedAircraftPopupHtml(i: MapActiveItem) {
  const callsign = i.callsign?.trim() ? i.callsign.trim() : null;
  const reg = i.aircraft?.registration?.trim()
    ? i.aircraft.registration.trim()
    : null;

  const title = callsign ?? reg ?? i.icao24;

  const meta: string[] = [];
  if (i.aircraft?.operatorName) meta.push(i.aircraft.operatorName);
  if (i.aircraft?.typeCode) meta.push(i.aircraft.typeCode);
  if (i.aircraft?.manufacturerName) meta.push(i.aircraft.manufacturerName);
  if (i.aircraft?.model) meta.push(i.aircraft.model);

  const data: string[] = [];
  data.push(i.icao24);
  if (i.alt != null) data.push(`${Math.round(i.alt).toLocaleString()} m`);
  const kmh = kmhFromMs(i.vel);
  if (kmh != null) data.push(`${kmh} km/h`);
  const ago = minutesAgoLabel(i.lastSeenUtc);
  if (ago) data.push(ago);

  return `
<div style="
  font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  width: 280px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(16,16,16,0.86);
  color: rgba(255,255,255,0.92);
  box-shadow: 0 10px 28px rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
">
  <div style="font-weight:750;font-size:13px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
    ${esc(title)}
  </div>

  ${
    meta.length > 0
      ? `<div style="margin-top:4px;font-size:12px;opacity:.85;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
           ${esc(meta.slice(0, 2).join(" • "))}
         </div>`
      : ""
  }

  <div style="margin-top:2px;font-size:12px;opacity:.72;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
    ${esc(data.join(" • "))}
  </div>
</div>
`.trim();
}
