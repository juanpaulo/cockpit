import { z } from "zod";
import type { Readout } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const fixtureSchema = z.object({
  currently: z.object({
    temperatureC: z.number(),
    condition: z.string(),
  }),
  asOf: z.string(),
});

export class MockWeatherSensor implements Sensor {
  readonly id = "weather" as const;
  readonly name = "Weather";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const w = loadFixture("weather", fixtureSchema, now);
    const readouts: Readout[] = [
      {
        id: "weather:current",
        source: "weather",
        segment: "",
        title: w.currently.condition,
        timestamp: w.asOf,
        url: "",
        status: "advisory",
        meta: { tempC: w.currently.temperatureC, condition: w.currently.condition },
      },
    ];
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
