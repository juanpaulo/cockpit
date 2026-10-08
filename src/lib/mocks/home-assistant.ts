import { z } from "zod";
import type { Readout, ReadoutStatus } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const fixtureSchema = z.array(
  z.object({
    entity_id: z.string(),
    state: z.string(),
    last_changed: z.string(),
    attributes: z
      .object({ friendly_name: z.string().optional() })
      .catchall(z.unknown())
      .optional(),
  }),
);

function statusFor(entityId: string, state: string): ReadoutStatus {
  const domain = entityId.split(".")[0];
  if (domain === "lock" && state === "unlocked") return "warning";
  return "advisory";
}

export class MockHomeAssistantSensor implements Sensor {
  readonly id = "home-assistant" as const;
  readonly name = "Home Assistant";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const states = loadFixture("home-assistant", fixtureSchema, now);
    const readouts: Readout[] = states.map((s) => ({
      id: `home-assistant:${s.entity_id}`,
      source: "home-assistant",
      segment: "",
      title: s.attributes?.friendly_name ?? s.entity_id,
      subtitle: [s.state, s.attributes?.unit_of_measurement]
        .filter(Boolean)
        .join(" "),
      timestamp: s.last_changed,
      url: "",
      status: statusFor(s.entity_id, s.state),
      meta: { entityId: s.entity_id, state: s.state },
    }));
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
