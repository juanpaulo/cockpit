import { currentProfile } from "@/lib/auth/current-profile";
import { MemoryCache } from "@/lib/cache/memory";
import { loadAppConfig } from "@/lib/config/app-config";
import { ConfigError } from "@/lib/errors";
import { filterReadouts, visibleSegments } from "@/lib/profiles/model";
import type { Profile } from "@/lib/profiles/model";
import type { Readout } from "@/lib/readouts/types";
import { resolveSegments } from "@/lib/segments/mapper";
import type { Segment } from "@/lib/segments/model";
import { getSensors } from "@/lib/sensors/registry";
import type { Sensor, SensorResult } from "@/lib/sensors/types";

export interface Dashboard {
  profile?: Profile;
  segments: Segment[];
  /** Profile-filtered, segment-resolved readouts (weather excluded). */
  items: Readout[];
  /** The weather sensor's readout, for the header window. */
  weather?: Readout;
  /** Per-source fetch results, for the SYS strip and failed-sensor errors. */
  results: { sensor: Sensor; result: SensorResult }[];
  /** Earliest event whose start is still ahead — feeds the countdowns. */
  nextEvent?: Readout;
  /** Event currently in progress (start <= now < end), if any. */
  nowEvent?: Readout;
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

  // Weather feeds the header window, not the segment panels.
  const weatherResult = results.find((r) => r.sensor.id === "weather");
  const weather =
    weatherResult?.result.ok === true ? weatherResult.result.readouts[0] : undefined;

  const all = resolveSegments(
    results.flatMap((r) =>
      r.result.ok && r.sensor.id !== "weather" ? r.result.readouts : [],
    ),
    config.segments,
  );
  const visible = filterReadouts(all, profile);
  const items = onlySegment ? visible.filter((r) => r.segment === onlySegment) : visible;

  const events = items
    .filter((r) => r.source === "calendar")
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const eventEnd = (r: Readout) =>
    typeof r.meta?.end === "string" ? r.meta.end : r.timestamp;
  const nextEvent = events.find(
    (r) => new Date(r.timestamp).getTime() > now.getTime(),
  );
  const nowEvent = events.find(
    (r) =>
      new Date(r.timestamp).getTime() <= now.getTime() &&
      new Date(eventEnd(r)).getTime() >= now.getTime(),
  );

  return {
    profile,
    segments: visibleSegments(config.segments, profile),
    items,
    weather,
    results,
    nextEvent,
    nowEvent,
    fetchedAt: now.toISOString(),
    dataMode: config.dataMode,
  };
}
