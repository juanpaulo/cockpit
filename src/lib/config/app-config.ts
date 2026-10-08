import { z } from "zod";
import { ConfigError } from "@/lib/errors";
import type { Profile } from "@/lib/profiles/model";
import { profilesFileSchema } from "@/lib/profiles/model";
import type { SourceId } from "@/lib/readouts/types";
import { SOURCE_IDS } from "@/lib/readouts/types";
import type { Segment } from "@/lib/segments/model";
import { segmentsFileSchema } from "@/lib/segments/model";
import { loadYamlConfig } from "./load";

const homeCardSchema = z.object({
  type: z.enum(["solar", "locks", "climate", "garage"]),
  entities: z.array(z.string()),
});

/** An entity the app may act on via POST /api/actions — the allowlist. */
const controlSchema = z.object({
  entity: z.string(),
  /** HA service names this entity accepts, e.g. ["toggle"], ["lock","unlock"]. */
  actions: z.array(z.string()).min(1),
  /** Two-tap confirm in the UI (locks, covers, anything that feels irreversible). */
  confirm: z.boolean().default(false),
});

export const homeFileSchema = z.object({
  cards: z.array(homeCardSchema),
  controls: z.array(controlSchema).default([]),
});

export type HomeCard = z.infer<typeof homeCardSchema>;
export type Control = z.infer<typeof controlSchema>;

export interface AppConfig {
  dataMode: "mock" | "live";
  /** Sources that stay on fixtures while DATA_MODE=live. */
  mockSensors: SourceId[];
  segments: Segment[];
  profiles: Profile[];
  home: HomeCard[];
  /** Controllable entities — anything absent is rejected by /api/actions. */
  controls: Control[];
  env: NodeJS.ProcessEnv;
}

function parseDataMode(): "mock" | "live" {
  const mode = process.env.DATA_MODE ?? "mock";
  if (mode !== "mock" && mode !== "live") {
    throw new ConfigError(`DATA_MODE must be "mock" or "live", got "${mode}".`);
  }
  return mode;
}

function parseMockSensors(): SourceId[] {
  const raw = process.env.MOCK_SENSORS?.trim();
  if (!raw) return [];
  const ids = raw.split(",").map((s) => s.trim()) as SourceId[];
  const unknown = ids.filter((id) => !SOURCE_IDS.includes(id));
  if (unknown.length) {
    throw new ConfigError(
      `MOCK_SENSORS has unknown sources: ${unknown.join(", ")}. Valid: ${SOURCE_IDS.join(", ")}.`,
    );
  }
  return ids;
}

export function loadAppConfig(): AppConfig {
  const dataMode = parseDataMode();
  // Real config is required in live mode; mock mode falls back to .example files.
  const required = dataMode === "live";
  const segments = loadYamlConfig("segments", segmentsFileSchema, { required });
  if (!segments) {
    throw new ConfigError("Missing config/segments.example.yaml — the committed template should exist.");
  }
  const home = loadYamlConfig("home", homeFileSchema, { required: false });
  return {
    dataMode,
    mockSensors: parseMockSensors(),
    segments: segments.segments,
    profiles: loadYamlConfig("profiles", profilesFileSchema, { required })?.profiles ?? [],
    home: home?.cards ?? [],
    controls: home?.controls ?? [],
    env: process.env,
  };
}
