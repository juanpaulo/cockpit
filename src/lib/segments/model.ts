import { z } from "zod";

const segmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  parent: z.string().optional(),
  gmail_labels: z.array(z.string()).default([]),
  calendars: z.array(z.string()).default([]),
  notion_values: z.array(z.string()).default([]),
  default: z.boolean().optional(),
});

export const segmentsFileSchema = z.object({
  segments: z.array(segmentSchema).min(1),
});

export type Segment = z.infer<typeof segmentSchema>;
