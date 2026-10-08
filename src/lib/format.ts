const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "14:32" */
export function hhmm(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function timeOfDay(iso: string): string {
  return hhmm(iso);
}

/** "15:15–16:00" */
export function eventRange(startIso: string, endIso?: string): string {
  return `${hhmm(startIso)}–${endIso ? hhmm(endIso) : ""}`;
}

/** "T−00:43" countdown to a future instant. */
export function countdown(iso: string, now: Date): string {
  const ms = Math.max(0, new Date(iso).getTime() - now.getTime());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `T−${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const dowFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Due label for needs-you chips and checklist rows.
 * style "late": tasks → "2D LATE" / "TODAY" / "SAT 10".
 * style "since": state/comms items → "SINCE 13:50" / "SINCE SAT 10".
 */
export function dueLabel(iso: string, now: Date, style: "late" | "since" = "late"): string {
  const at = new Date(iso);
  const dow = `${dowFmt.format(at).toUpperCase()} ${at.getDate()}`;
  if (at.getTime() < now.getTime()) {
    if (style === "since") {
      return sameDay(at, now) ? `SINCE ${hhmm(iso)}` : `SINCE ${dow}`;
    }
    const daysLate = Math.floor(
      (new Date(now).setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000,
    );
    return daysLate > 0 ? `${daysLate}D LATE` : "LATE TODAY";
  }
  if (sameDay(at, now)) return `TODAY ${hhmm(iso)}`;
  return dow;
}

export function relativeTime(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const suffix = diff < 0 ? "ago" : "from now";
  if (abs < 60_000) return "now";
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m ${suffix}`;
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ${suffix}`;
  return `${Math.round(abs / 86_400_000)}d ${suffix}`;
}

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/** "THU 08 OCT" for header readouts. */
export function readoutDate(d: Date): string {
  return `${dowFmt.format(d).toUpperCase()} ${String(d.getDate()).padStart(2, "0")} ${new Intl.DateTimeFormat("en-US", { month: "short" })
    .format(d)
    .toUpperCase()}`;
}

export function jpy(n: number): string {
  return `¥${Math.round(n).toLocaleString()}`;
}

export function signedPct(n: number | undefined): string {
  if (n === undefined) return "";
  const sign = n > 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}
