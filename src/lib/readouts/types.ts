import { z } from "zod";

export const sourceIdSchema = z.enum([
  "gmail",
  "calendar",
  "notion-task",
  "investment",
  "home-assistant",
  "weather",
]);

export type SourceId = z.infer<typeof sourceIdSchema>;

export const SOURCE_IDS: readonly SourceId[] = sourceIdSchema.options;

export const readoutStatusSchema = z.enum(["advisory", "caution", "warning"]);

export type ReadoutStatus = z.infer<typeof readoutStatusSchema>;

export const readoutSchema = z.object({
  id: z.string(),
  source: sourceIdSchema,
  /** Resolved segment id. Sensors leave this empty; the segment mapper fills it. */
  segment: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  /** ISO 8601 */
  timestamp: z.iso.datetime(),
  /** Links must be http(s) — or empty for non-link rows (e.g. HA entities). */
  url: z.string().refine((u) => u === "" || /^https?:\/\//i.test(u), {
    message: "url must be http(s):// or empty",
  }),
  status: readoutStatusSchema,
  /** Source-native tags and per-source extras (labels, calendar name, entity state…). */
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Readout = z.infer<typeof readoutSchema>;
