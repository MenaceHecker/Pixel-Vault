import { kv } from "@/lib/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "Missing ids" }, { status: 400 });
  }

  const deletedAt = new Date().toISOString();

  await Promise.all(
    ids.map(async (id) => {
      await kv.hset(`file:${id}`, {
        status: "deleted_from_iphone",
        deletedFromIphoneAt: deletedAt,
      });

      await kv.srem("archived_files", id);
      await kv.sadd("deleted_from_iphone_files", id);
    })
  );

  return Response.json({
    status: "ok",
    deletedCount: ids.length,
  });
}