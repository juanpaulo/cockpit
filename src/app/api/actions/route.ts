import { connection } from "next/server";
import { z } from "zod";
import { loadAppConfig } from "@/lib/config/app-config";

const actionSchema = z.object({
  /** HA entity id, e.g. "lock.front_door". */
  entity: z.string(),
  /** HA service name the control allows, e.g. "toggle", "lock". */
  action: z.string(),
});

/**
 * Controls channel — the app's only write path. Narrow on purpose: the
 * entity+action must be allowlisted in config/home.yaml, so a buggy or
 * hostile client can only flip switches the config chose. The HA service
 * call itself (POST {HA_BASE_URL}/api/services/<domain>/<action>) wires in
 * with the Home Assistant sensor; until then allowlisted calls get a 501.
 */
export async function POST(request: Request) {
  await connection();
  // Writes need a real caller, not just CF-edge reachability: the identity
  // Cloudflare Access injects (cf-access-authenticated-user-email), or a
  // dev profile for mock development — matches the profile model.
  const caller =
    request.headers.get("cf-access-authenticated-user-email") ??
    process.env.COCKPIT_DEV_PROFILE;
  if (!caller) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid action" }, { status: 422 });
  }

  const { entity, action } = parsed.data;
  const control = loadAppConfig().controls.find(
    (c) => c.entity === entity && c.actions.includes(action),
  );
  if (!control) {
    return Response.json({ error: "entity/action not allowlisted" }, { status: 403 });
  }

  // TODO: POST {HA_BASE_URL}/api/services/<domain>/<action> with HA_TOKEN,
  // then re-GET the entity and return its new state (post-write freshness).
  return Response.json(
    { error: "controls not wired yet", entity, action },
    { status: 501 },
  );
}
