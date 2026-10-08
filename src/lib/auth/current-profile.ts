import type { AppConfig } from "@/lib/config/app-config";
import type { Profile } from "@/lib/profiles/model";

// Cloudflare Access JWT verification lands in step 3; until then the
// COCKPIT_DEV_PROFILE env picks a profile for mock development, defaulting
// to the first profile in config.
export function currentProfile(config: AppConfig): Profile | undefined {
  const requested = config.env.COCKPIT_DEV_PROFILE;
  return (
    config.profiles.find((p) => p.id === requested) ??
    config.profiles.find((p) => p.segments.includes("*")) ??
    config.profiles[0]
  );
}
