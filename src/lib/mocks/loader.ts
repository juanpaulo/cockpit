import { readFileSync } from "node:fs";
import path from "node:path";
import type { ZodType } from "zod";
import { ConfigError } from "@/lib/errors";

const FIXTURES_DIR = () =>
  path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    process.env.FIXTURES_DIR ?? "fixtures",
  );

const TOKEN = /^(now|today)((?:[+-]\d+[mhd]?)+)?$/;
const OFFSET = /([+-]\d+)([mhd])?/g;

const UNIT_MS = { m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

function resolveToken(value: string, now: Date): string | undefined {
  const match = TOKEN.exec(value);
  if (!match) return undefined;
  const base = new Date(now);
  if (match[1] === "today") base.setHours(0, 0, 0, 0);
  let time = base.getTime();
  if (match[2]) {
    for (const m of match[2].matchAll(OFFSET)) {
      time += Number(m[1]) * UNIT_MS[(m[2] ?? "d") as "m" | "h" | "d"];
    }
  }
  return new Date(time).toISOString();
}

function resolveDates(node: unknown, now: Date): unknown {
  if (typeof node === "string") return resolveToken(node, now) ?? node;
  if (Array.isArray(node)) return node.map((v) => resolveDates(v, now));
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, resolveDates(v, now)]),
    );
  }
  return node;
}

/**
 * Loads fixtures/<name>.json and resolves relative date tokens
 * ("now-25m", "today+3") against `now`, then validates against the
 * fixture's schema (fixtures mimic raw upstream responses).
 */
export function loadFixture<T>(name: string, schema: ZodType<T>, now: Date): T {
  const file = path.join(FIXTURES_DIR(), `${name}.json`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new ConfigError(`Missing or unreadable fixture: ${file}`);
  }
  const result = schema.safeParse(resolveDates(raw, now));
  if (!result.success) {
    throw new ConfigError(`Invalid fixture ${name}.json: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}
