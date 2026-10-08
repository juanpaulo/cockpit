import { z } from "zod";
import type { Readout, ReadoutStatus } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const fixtureSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      properties: z.object({
        Name: z.object({ title: z.array(z.object({ plain_text: z.string() })) }),
        Status: z.object({ select: z.object({ name: z.string() }).nullable() }),
        Due: z.object({ date: z.object({ start: z.string() }).nullable() }),
        Segment: z.object({ select: z.object({ name: z.string() }).nullable() }),
      }),
    }),
  ),
});

const DAY_MS = 86_400_000;

export class MockNotionTasksSensor implements Sensor {
  readonly id = "notion-task" as const;
  readonly name = "Notion tasks";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const { results } = loadFixture("notion-tasks", fixtureSchema, now);
    const todayEnd = new Date(now).setHours(23, 59, 59, 999);
    const weekEnd = todayEnd + 7 * DAY_MS;

    const readouts: Readout[] = results
      .filter((t) => t.properties.Status.select?.name !== "Done")
      .flatMap((t) => {
        const due = t.properties.Due.date?.start;
        if (!due) return [];
        const dueAt = new Date(due).getTime();
        if (dueAt > weekEnd) return [];
        const status: ReadoutStatus =
          dueAt < now.getTime() ? "warning" : dueAt <= todayEnd ? "caution" : "advisory";
        return [
          {
            id: `notion-task:${t.id}`,
            source: "notion-task" as const,
            segment: "",
            title: t.properties.Name.title[0]?.plain_text ?? "(untitled)",
            subtitle: t.properties.Status.select?.name,
            timestamp: due,
            url: t.url,
            status,
            meta: { notionSegment: t.properties.Segment.select?.name, due },
          },
        ];
      });
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
