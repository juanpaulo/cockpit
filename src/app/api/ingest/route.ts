import crypto from "node:crypto";
import { connection } from "next/server";
import { snapshotSchema } from "@/lib/snapshot/schema";
import { getSnapshotStore } from "@/lib/snapshot/store";

function authorized(request: Request, token: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!bearer || bearer.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(bearer), Buffer.from(token));
}

/** Collector → web handoff: validate the snapshot contract, persist latest. */
export async function POST(request: Request) {
  await connection();
  const token = process.env.INGEST_TOKEN;
  if (!token) {
    return Response.json({ error: "INGEST_TOKEN not configured" }, { status: 503 });
  }
  if (!authorized(request, token)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const text = await request.text().catch(() => null);
  if (!text || text.length > 256 * 1024) {
    return Response.json({ error: "body too large or missing" }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 422 });
  }
  const parsed = snapshotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid snapshot", issues: parsed.error.issues.slice(0, 5) },
      { status: 422 },
    );
  }
  getSnapshotStore().write(parsed.data);
  return Response.json({ ok: true, generatedAt: parsed.data.generatedAt });
}
