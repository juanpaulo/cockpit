import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { ZodType } from "zod";
import { ConfigError } from "@/lib/errors";

const CONFIG_DIR = () =>
  path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    process.env.CONFIG_DIR ?? "config",
  );

/**
 * Reads config/<name>.yaml. In mock mode, missing real config falls back to
 * the committed .example file so the dev VM can run without real accounts.
 * In live mode a missing file fails, naming the template to copy.
 */
export function loadYamlConfig<T>(
  name: "segments" | "profiles" | "home",
  schema: ZodType<T>,
  opts: { required: boolean },
): T | undefined {
  const realPath = path.join(CONFIG_DIR(), `${name}.yaml`);
  const examplePath = path.join(CONFIG_DIR(), `${name}.example.yaml`);

  let file: string;
  try {
    file = readFileSync(realPath, "utf8");
  } catch {
    if (opts.required) {
      throw new ConfigError(
        `Missing ${realPath}. Copy ${examplePath} and fill in your values.`,
      );
    }
    try {
      file = readFileSync(examplePath, "utf8");
    } catch {
      return undefined;
    }
  }

  const result = schema.safeParse(parse(file));
  if (!result.success) {
    throw new ConfigError(`Invalid ${name}.yaml: ${result.error.issues[0]?.message}`);
  }
  return result.data;
}
