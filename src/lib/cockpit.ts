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
import type { Sensor, SensorContext, SensorResult } from "@/lib/sensors/types";
import type { AppConfig } from "@/lib/config/app-config";
import { SensorError } from "@/lib/errors";
import type { Snapshot } from "@/lib/snapshot/schema";
import { getSnapshotStore } from "@/lib/snapshot/store";

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
  // Live mode reads the latest stored snapshot — the collector is the only
  // writer — and reports a per-source error for anything absent, so a
  // stale/missing source ages its own SYS dot instead of taking the board down.
  const snapshot = config.dataMode === "live" ? getSnapshotStore().readLatest() : undefined;
  const results = await collectResults(config, sensors, ctx, snapshot);
  const snapshotAt = snapshot?.generatedAt ?? now.toISOString();

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
    fetchedAt: snapshotAt,
    dataMode: config.dataMode,
  };
}

async function collectResults(
  config: AppConfig,
  sensors: Sensor[],
  ctx: SensorContext,
  snapshot?: Snapshot,
): Promise<{ sensor: Sensor; result: SensorResult }[]> {
  if (config.dataMode === "mock") {
    return Promise.all(
      sensors.map(async (sensor) => ({
        sensor,
        result: await sensor.fetchReadouts(ctx),
      })),
    );
  }

  const bySource = new Map(snapshot?.sources.map((s) => [s.source, s]) ?? []);
  return sensors.map((sensor) => {
    const entry = bySource.get(sensor.id);
    if (!entry) {
      return {
        sensor,
        result: {
          ok: false,
          error: new SensorError(
            snapshot ? "source absent from snapshot" : "no snapshot received yet",
            "no_snapshot",
          ),
          fetchedAt: snapshot?.generatedAt ?? ctx.now.toISOString(),
        },
      };
    }
    const result: SensorResult = entry.ok
      ? { ok: true, readouts: entry.readouts, fetchedAt: entry.fetchedAt }
      : {
          ok: false,
          error: new SensorError(entry.error.message, entry.error.code),
          fetchedAt: entry.fetchedAt,
        };
    return { sensor, result };
  });
}
