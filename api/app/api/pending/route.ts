import { kv } from "@vercel/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { VaultFile, PendingFile, PendingResponse } from "@/lib/types";

export const runtime = "edge";

export async function GET(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  // Get all pending file IDs
  const pendingIds = await kv.smembers("pending_files") as string[];

  if (!pendingIds || pendingIds.length === 0) {
    const response: PendingResponse = { files: [] };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch all records in parallel
  const records = await Promise.all(
    pendingIds.map((id) => kv.hgetall(`file:${id}`) as Promise<VaultFile | null>)
  );

  const files: PendingFile[] = records
    .filter((r): r is VaultFile => r !== null && r.status === "pending")
    .map((r) => ({
      id: r.id,
      url: r.blobUrl,
      filename: r.filename,
      takenAt: r.takenAt,
      size: r.size,
    }));

  const response: PendingResponse = { files };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
