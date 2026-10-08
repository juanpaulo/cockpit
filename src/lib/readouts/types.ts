export type SourceId =
  | "gmail"
  | "calendar"
  | "notion-task"
  | "investment"
  | "home-assistant"
  | "weather";

export const SOURCE_IDS: readonly SourceId[] = [
  "gmail",
  "calendar",
  "notion-task",
  "investment",
  "home-assistant",
  "weather",
];

export type ReadoutStatus = "advisory" | "caution" | "warning";

export interface Readout {
  id: string;
  source: SourceId;
  /** Resolved segment id. Sensors leave this empty; the segment mapper fills it. */
  segment: string;
  title: string;
  subtitle?: string;
  /** ISO 8601 */
  timestamp: string;
  url: string;
  status: ReadoutStatus;
  /** Source-native tags and per-source extras (labels, calendar name, entity state…). */
  meta?: Record<string, unknown>;
}
