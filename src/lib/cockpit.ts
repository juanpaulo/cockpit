import { currentProfile } from "@/lib/auth/current-profile";
import { MemoryCache } from "@/lib/cache/memory";
import { loadAppConfig } from "@/lib/config/app-config";
import { ConfigError } from "@/lib/errors";
import { filterReadouts, visibleSegments } from "@/lib/profiles/model";
import type { Profile } from "@/lib/profiles/model";
import type { Readout, SourceId } from "@/lib/readouts/types";
import { resolveSegments } from "@/lib/segments/mapper";
import type { Segment } from "@/lib/segments/model";
import { getSensors } from "@/lib/sensors/registry";
import type { Sensor, SensorResult } from "@/lib/sensors/types";

export interface SegmentSection {
  segment: Segment;
  /** Per-source results for this segment, in SOURCE order. */
  results: { sensor: Sensor; result: SensorResult }[];
}

export interface SegmentCounts {
  unread: number;
  eventsToday: number;
  tasksDue: number;
}

export interface Dashboard {
  profile?: Profile;
  segments: Segment[];
  sections: SegmentSection[];
  counts: Record<string, SegmentCounts>;
  nextEvent?: Readout;
  fetchedAt: string;
  dataMode: "mock" | "live";
}

export async function loadDashboard(onlySegment?: string): Promise<Dashboard> {
  const config = loadAppConfig();
  const profile = currentProfile(config);
  if (!profile) throw new ConfigError("No profile resolved — check profiles.yaml.");

  const now = new Date();
  const ctx = { config, cache: new MemoryCache(), now };
  const sensors = getSensors(config);
  const results = await Promise.all(
    sensors.map(async (sensor) => ({ sensor, result: await sensor.fetchReadouts(ctx) })),
  );

  const all = resolveSegments(
    results.flatMap((r) => (r.result.ok ? r.result.readouts : [])),
    config.segments,
  );
  const visible = filterReadouts(all, profile);
  const scope = onlySegment ? visible.filter((r) => r.segment === onlySegment) : visible;

  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const todayEnd = new Date(now).setHours(23, 59, 59, 999);

  const counts: Record<string, SegmentCounts> = {};
  for (const r of scope) {
    const c = (counts[r.segment] ??= { unread: 0, eventsToday: 0, tasksDue: 0 });
    if (r.source === "gmail" && r.meta?.unread) c.unread += 1;
    if (r.source === "calendar") {
      const t = new Date(r.timestamp).getTime();
      if (t >= todayStart && t <= todayEnd) c.eventsToday += 1;
    }
    if (r.source === "notion-task" && new Date(r.timestamp).getTime() <= todayEnd) {
      c.tasksDue += 1;
    }
  }

  const nextEvent = scope
    .filter((r) => r.source === "calendar" && new Date(r.timestamp).getTime() >= now.getTime())
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))[0];

  // A failed sensor emits no readouts to map; its error instrument attaches
  // to the source's fixed segment, else the default segment.
  const defaultId = config.segments.find((s) => s.default)?.id ?? config.segments[0].id;
  const errorSegment: Partial<Record<SourceId, string>> = {
    investment: "investments",
    "home-assistant": "home",
  };

  const sections = visibleSegments(config.segments, profile)
    .filter((s) => !onlySegment || s.id === onlySegment)
    .map((segment) => ({
      segment,
      results: results
        .map(({ sensor, result }) => ({
          sensor,
          result: result.ok
            ? {
                ...result,
                readouts: scope.filter(
                  (r) => r.segment === segment.id && r.source === sensor.id,
                ),
              }
            : result,
        }))
        .filter(
          ({ sensor, result }) =>
            result.ok
              ? result.readouts.length > 0
              : (errorSegment[sensor.id] ?? defaultId) === segment.id,
        ),
    }));

  return {
    profile,
    segments: visibleSegments(config.segments, profile),
    sections,
    counts,
    nextEvent,
    fetchedAt: now.toISOString(),
    dataMode: config.dataMode,
  };
}
