import type { Readout, SourceId } from "@/lib/readouts/types";
import type { Segment } from "./model";

// Sources whose segment is fixed by definition (README: "Always Investments",
// "Always Home Automation").
const FIXED_SEGMENTS: Partial<Record<SourceId, string>> = {
  investment: "investments",
  "home-assistant": "home",
};

function defaultSegmentId(segments: Segment[]): string {
  return segments.find((s) => s.default)?.id ?? segments[0].id;
}

export function resolveSegmentId(readout: Readout, segments: Segment[]): string {
  const fixed = FIXED_SEGMENTS[readout.source];
  if (fixed && segments.some((s) => s.id === fixed)) return fixed;

  const meta = readout.meta ?? {};
  const tagged = segments.find((s) => {
    switch (readout.source) {
      case "gmail":
        return arrayMeta(meta.labels).some((l) => s.gmail_labels.includes(l));
      case "calendar":
        return s.calendars.includes(String(meta.calendar ?? ""));
      case "notion-task":
        return s.notion_values.includes(String(meta.notionSegment ?? ""));
      default:
        return false;
    }
  });
  return tagged?.id ?? defaultSegmentId(segments);
}

function arrayMeta(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/** Fills `segment` on every readout; untagged items land on the default segment. */
export function resolveSegments(readouts: Readout[], segments: Segment[]): Readout[] {
  return readouts.map((r) => ({ ...r, segment: resolveSegmentId(r, segments) }));
}
