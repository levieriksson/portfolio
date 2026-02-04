export function formatUtcDateTime(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function utcTodayString(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatSvLocalDateTime(utcIso: string): string {
  const d = new Date(utcIso);

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function stockholmTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatLastSeenSmartSv(utcIso: string): string {
  const d = new Date(utcIso);

  const now = new Date();
  const stockholmYMD = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(x);

  const ymdD = stockholmYMD(d);
  const ymdNow = stockholmYMD(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const ymdYesterday = stockholmYMD(yesterday);

  const time = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  if (ymdD === ymdNow) return `Idag ${time}`;
  if (ymdD === ymdYesterday) return `Igår ${time}`;

  const dateTime = formatSvLocalDateTime(utcIso);
  return dateTime;
}
