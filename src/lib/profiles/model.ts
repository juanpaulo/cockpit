import { z } from "zod";
import type { Readout } from "@/lib/readouts/types";
import type { Segment } from "@/lib/segments/model";

const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  emails: z.array(z.string()),
  segments: z.array(z.string()),
});

export const profilesFileSchema = z.object({
  profiles: z.array(profileSchema).min(1),
});

export type Profile = z.infer<typeof profileSchema>;

function seesAll(profile: Profile): boolean {
  return profile.segments.includes("*");
}

export function filterReadouts(readouts: Readout[], profile: Profile): Readout[] {
  if (seesAll(profile)) return readouts;
  return readouts.filter((r) => profile.segments.includes(r.segment));
}

export function visibleSegments(segments: Segment[], profile: Profile): Segment[] {
  if (seesAll(profile)) return segments;
  return segments.filter((s) => profile.segments.includes(s.id));
}
