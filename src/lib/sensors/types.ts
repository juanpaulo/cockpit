import type { Cache } from "@/lib/cache/types";
import type { AppConfig } from "@/lib/config/app-config";
import type { SensorError } from "@/lib/errors";
import type { Readout, SourceId } from "@/lib/readouts/types";

export interface Sensor {
  readonly id: SourceId;
  readonly name: string;

  fetchReadouts(ctx: SensorContext): Promise<SensorResult>;
}

export interface SensorContext {
  config: AppConfig;
  cache: Cache;
  now: Date;
}

export type SensorResult =
  | { ok: true; readouts: Readout[]; fetchedAt: string }
  | { ok: false; error: SensorError; fetchedAt: string };
