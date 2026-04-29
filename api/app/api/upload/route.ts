import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { VaultFile, UploadResponse } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const filename = formData.get("filename") as string | null;
  const takenAt = formData.get("takenAt") as string | null;

  if (!file || !filename) {
    return new Response(JSON.stringify({ error: "Missing file or filename" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = nanoid();
  const blobKey = `pixel-vault/${id}-${filename}`;

  // Upload to Vercel Blob
  const blob = await put(blobKey, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });

  const record: VaultFile = {
    id,
    filename,
    takenAt: takenAt || new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
    status: "pending",
    blobUrl: blob.url,
    size: file.size,
  };

  // Store record in KV
  await kv.hset(`file:${id}`, record);
  await kv.sadd("pending_files", id);

  // Increment total upload counter
  await kv.incr("stats:total_uploaded");

  const response: UploadResponse = { id, status: "pending" };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
