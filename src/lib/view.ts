// View-model derivations from Readouts → the panel shapes the design renders.
import type { Readout, ReadoutStatus, SourceId } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { dueLabel } from "@/lib/format";

const SEV_RANK: Record<ReadoutStatus, number> = { warning: 0, caution: 1, advisory: 2 };

export interface NeedItem {
  id: string;
  title: string;
  due: string;
  status: ReadoutStatus;
  url: string;
}

function needDueStyle(r: Readout): "late" | "since" {
  return r.source === "notion-task" ? "late" : "since";
}

/** Items that require the user: warnings + cautions + advisory tasks/replies. */
export function needs(items: Readout[], now: Date): { items: NeedItem[]; overflow: number } {
  const ranked = items
    .filter(
      (r) =>
        r.status !== "advisory" ||
        r.source === "notion-task" ||
        (r.source === "gmail" && r.meta?.needsReply === true),
    )
    .sort(
      (a, b) =>
        SEV_RANK[a.status] - SEV_RANK[b.status] ||
        +new Date(a.timestamp) - +new Date(b.timestamp),
    );
  return {
    items: ranked.slice(0, 8).map((r) => ({
      id: r.id,
      title: r.title,
      due: dueLabel(r.timestamp, now, needDueStyle(r)),
      status: r.status,
      url: r.url,
    })),
    overflow: Math.max(0, ranked.length - 8),
  };
}

export interface CommsView {
  replies: Readout[];
  fyi: Readout[];
  tasks: Readout[];
}

export function commsView(items: Readout[]): CommsView {
  const mail = items.filter((r) => r.source === "gmail");
  return {
    replies: mail.filter((r) => r.meta?.needsReply === true),
    fyi: mail
      .filter((r) => r.meta?.needsReply !== true)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 6),
    tasks: items
      .filter((r) => r.source === "notion-task")
      .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)),
  };
}

export interface PlanEvent {
  readout: Readout;
  isPast: boolean;
  isNext: boolean;
}

export interface PlanView {
  events: PlanEvent[];
  pastTitles: string[];
  leftToday: number;
}

export function planView(items: Readout[], now: Date): PlanView {
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const todayEnd = new Date(now).setHours(23, 59, 59, 999);
  const events = items
    .filter((r) => {
      if (r.source !== "calendar") return false;
      const start = new Date(r.timestamp).getTime();
      const endStr = typeof r.meta?.end === "string" ? r.meta.end : r.timestamp;
      const end = new Date(endStr).getTime();
      // Events overlapping today: not entirely before today, not after today.
      return end >= todayStart && start <= todayEnd;
    })
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const nextIdx = events.findIndex((r) => {
    const end = typeof r.meta?.end === "string" ? new Date(r.meta.end) : new Date(r.timestamp);
    return end.getTime() >= now.getTime();
  });
  return {
    events: events.map((r, i) => ({
      readout: r,
      isPast: nextIdx === -1 ? true : i < nextIdx,
      isNext: i === nextIdx,
    })),
    pastTitles:
      nextIdx === -1
        ? events.map((r) => r.title)
        : events.slice(0, nextIdx).map((r) => r.title),
    leftToday: nextIdx === -1 ? 0 : events.length - nextIdx,
  };
}

export interface MarketView {
  holdings: Readout[];
  total?: Readout;
  keyDates: Readout[];
}

export function marketView(items: Readout[]): MarketView {
  const inv = items.filter((r) => r.source === "investment");
  return {
    holdings: inv.filter((r) => r.meta?.kind === "holding"),
    total: inv.find((r) => r.meta?.kind === "total"),
    keyDates: inv.filter((r) => r.meta?.kind === "key-date"),
  };
}

/** Exceptions first (severity order), then normal rows in fixture order. */
export function homeView(items: Readout[]): Readout[] {
  return items
    .filter((r) => r.source === "home-assistant")
    .sort((a, b) => SEV_RANK[a.status] - SEV_RANK[b.status]);
}

export interface SourceHealth {
  id: string;
  label: string;
  ok: boolean;
}

const SYS_LABEL: Record<string, string> = {
  "home-assistant": "HA",
  calendar: "CAL",
  gmail: "GMAIL",
  "notion-task": "NOTION",
  investment: "MKT",
  weather: "WX",
};

const SYS_ORDER: SourceId[] = [
  "home-assistant",
  "calendar",
  "gmail",
  "notion-task",
  "investment",
  "weather",
];

export function sourceHealth(
  results: { sensor: Sensor; result: SensorResult }[],
): SourceHealth[] {
  const map = new Map(results.map((r) => [r.sensor.id, r.result.ok]));
  return SYS_ORDER.filter((id) => map.has(id)).map((id) => ({
    id,
    label: SYS_LABEL[id],
    ok: map.get(id) ?? false,
  }));
}

export interface WeatherView {
  tempC: number;
  condition: string;
}

export function weatherView(items: Readout[]): WeatherView | undefined {
  const w = items.find((r) => r.source === "weather");
  if (!w) return undefined;
  return {
    tempC: Number(w.meta?.tempC ?? 0),
    condition: String(w.meta?.condition ?? ""),
  };
}
