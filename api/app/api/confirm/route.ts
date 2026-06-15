import { del } from "@vercel/blob";
import { kv } from "@/lib/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { VaultFile, ConfirmResponse } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    typeof body.id !== "string" ||
    body.id.trim() === ""
  ) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const id = body.id;
  const record = (await kv.hgetall(`file:${id}`)) as VaultFile | null;

  if (!record) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  if (record.blobUrl) {
    await del(record.blobUrl);
  }

  const archivedAt = new Date().toISOString();

  await kv.hset(`file:${id}`, {
    status: "done",
    archivedAt,
    confirmedAt: archivedAt,
    blobUrl: "",
  });

  await kv.srem("pending_files", id);
  await kv.sadd("archived_files", id);

  await kv.set("stats:last_sync", archivedAt);
  await kv.incr("stats:total_archived");

  const response: ConfirmResponse = { id, status: "archived" };

  return Response.json(response);
}
