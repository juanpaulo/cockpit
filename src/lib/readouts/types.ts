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
  timestamp: z.string(),
  url: z.string(),
  status: readoutStatusSchema,
  /** Source-native tags and per-source extras (labels, calendar name, entity state…). */
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type Readout = z.infer<typeof readoutSchema>;
