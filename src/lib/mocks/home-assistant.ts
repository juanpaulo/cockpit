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
      .object({
        friendly_name: z.string().optional(),
        area: z.string().optional(),
        unit_of_measurement: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),
  }),
);

const KIND_LABEL: Record<string, string> = {
  lock: "Lock",
  cover: "Cover",
  climate: "Temperature",
  sensor: "Sensor",
  binary_sensor: "Sensor",
};

function statusFor(entityId: string, state: string): ReadoutStatus {
  const domain = entityId.split(".")[0];
  if (domain === "lock" && state === "unlocked") return "warning";
  if (domain === "cover" && state === "open") return "caution";
  return "advisory";
}

export class MockHomeAssistantSensor implements Sensor {
  readonly id = "home-assistant" as const;
  readonly name = "Home Assistant";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const states = loadFixture("home-assistant", fixtureSchema, now);
    const readouts: Readout[] = states.map((s) => {
      const domain = s.entity_id.split(".")[0];
      const kind = KIND_LABEL[domain] ?? "Sensor";
      const unit = s.attributes?.unit_of_measurement;
      return {
        id: `home-assistant:${s.entity_id}`,
        source: "home-assistant",
        segment: "",
        title: s.attributes?.friendly_name ?? s.entity_id,
        subtitle: [kind, s.attributes?.area].filter(Boolean).join(" · "),
        timestamp: s.last_changed,
        url: "",
        status: statusFor(s.entity_id, s.state),
        meta: {
          entityId: s.entity_id,
          state: s.state.toUpperCase(),
          unit,
          area: s.attributes?.area,
          kind,
        },
      };
    });
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
