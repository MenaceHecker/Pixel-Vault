import { del } from "@vercel/blob";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { VaultFile, ConfirmResponse } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  const body = await request.json();
  const { id } = body as { id: string };

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = await kv.hgetall(`file:${id}`) as VaultFile | null;

  if (!record) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete from Vercel Blob
  await del(record.blobUrl);

  // Update KV record status
  await kv.hset(`file:${id}`, { status: "done", confirmedAt: new Date().toISOString() });

  // Remove from pending set
  await kv.srem("pending_files", id);

  // Update stats
  await kv.set("stats:last_sync", new Date().toISOString());
  await kv.incr("stats:total_archived");

  const response: ConfirmResponse = { id, status: "done" };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
