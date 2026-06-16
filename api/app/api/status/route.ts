import { kv } from "@/lib/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  const pendingCount =
    ((await kv.scard("pending_files")) as number) || 0;

  const archivedCount =
    ((await kv.scard("archived_files")) as number) || 0;

  const lastSync =
    ((await kv.get("stats:last_sync")) as string | null) || null;

  return Response.json({
    pendingCount,
    archivedCount,
    lastSync,
  });
}