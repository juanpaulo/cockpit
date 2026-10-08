const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function timeOfDay(iso: string): string {
  return timeFmt.format(new Date(iso));
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

export function jpy(n: number): string {
  return `¥${Math.round(n).toLocaleString()}`;
}

export function signedPct(n: number | undefined): string {
  if (n === undefined) return "";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
