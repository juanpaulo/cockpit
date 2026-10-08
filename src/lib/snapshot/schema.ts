import { z } from "zod";
import { readoutSchema, sourceIdSchema } from "@/lib/readouts/types";

const fetchedAt = z.string();

/** One source's contribution to a snapshot — same union shape as SensorResult. */
export const snapshotSourceSchema = z.discriminatedUnion("ok", [
  z.object({
    source: sourceIdSchema,
    ok: z.literal(true),
    fetchedAt,
    readouts: z.array(readoutSchema),
  }),
  z.object({
    source: sourceIdSchema,
    ok: z.literal(false),
    fetchedAt,
    error: z.object({ message: z.string(), code: z.string().optional() }),
  }),
]);

/**
 * The collector's output contract — what POST /api/ingest accepts and what
 * the web service reads back. One snapshot per collector run; a source that
 * failed arrives as an ok:false entry so only its section ages.
 */
export const snapshotSchema = z.object({
  /** ISO 8601 — when the collector run produced this snapshot. */
  generatedAt: z.string(),
  sources: z.array(snapshotSourceSchema).min(1),
});

export type SnapshotSource = z.infer<typeof snapshotSourceSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
