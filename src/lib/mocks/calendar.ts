import { z } from "zod";
import type { Readout } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const fixtureSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      calendar: z.string(),
      location: z.string().optional(),
      start: z.object({ dateTime: z.string() }),
      end: z.object({ dateTime: z.string() }),
      htmlLink: z.string(),
    }),
  ),
});

const SOON_MS = 60 * 60 * 1000;

export class MockCalendarSensor implements Sensor {
  readonly id = "calendar" as const;
  readonly name = "Calendar";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const { items } = loadFixture("calendar", fixtureSchema, now);
    const readouts: Readout[] = items.map((e) => {
      const startsIn = new Date(e.start.dateTime).getTime() - now.getTime();
      return {
        id: `calendar:${e.id}`,
        source: "calendar",
        segment: "",
        title: e.summary,
        subtitle: [e.calendar, e.location].filter(Boolean).join(" · "),
        timestamp: e.start.dateTime,
        url: e.htmlLink,
        status: startsIn > 0 && startsIn <= SOON_MS ? "caution" : "advisory",
        meta: { calendar: e.calendar, end: e.end.dateTime },
      };
    });
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
