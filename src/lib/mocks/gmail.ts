import { z } from "zod";
import type { Readout } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const fixtureSchema = z.object({
  threads: z.array(
    z.object({
      id: z.string(),
      labels: z.array(z.string()),
      from: z.object({ name: z.string(), email: z.string() }),
      subject: z.string(),
      snippet: z.string(),
      // Fixture stand-ins for the future reply classifier/summarizer.
      needsReply: z.boolean().optional(),
      ask: z.string().optional(),
      internalDate: z.string(),
    }),
  ),
});

export class MockGmailSensor implements Sensor {
  readonly id = "gmail" as const;
  readonly name = "Gmail";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const { threads } = loadFixture("gmail", fixtureSchema, now);
    const readouts: Readout[] = threads.map((t) => ({
      id: `gmail:${t.id}`,
      source: "gmail",
      segment: "",
      title: t.subject,
      subtitle: t.needsReply ? t.ask : `${t.from.name} — ${t.snippet}`,
      timestamp: t.internalDate,
      url: `https://mail.google.com/mail/u/0/#all/${t.id}`,
      status: t.needsReply ? "caution" : "advisory",
      meta: {
        labels: t.labels,
        unread: t.labels.includes("UNREAD"),
        needsReply: t.needsReply ?? false,
        from: t.from.name,
        ask: t.ask,
        snippet: t.snippet,
      },
    }));
    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
