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

export const homeFileSchema = z.object({
  cards: z.array(homeCardSchema),
});

export type HomeCard = z.infer<typeof homeCardSchema>;

export interface AppConfig {
  dataMode: "mock" | "live";
  /** Sources that stay on fixtures while DATA_MODE=live. */
  mockSensors: SourceId[];
  segments: Segment[];
  profiles: Profile[];
  home: HomeCard[];
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
  return {
    dataMode,
    mockSensors: parseMockSensors(),
    segments: segments.segments,
    profiles: loadYamlConfig("profiles", profilesFileSchema, { required })?.profiles ?? [],
    home: loadYamlConfig("home", homeFileSchema, { required: false })?.cards ?? [],
    env: process.env,
  };
}
