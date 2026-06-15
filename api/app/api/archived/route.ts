import { kv } from "@/lib/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { VaultFile } from "@/lib/types";

export const runtime = "edge";

export async function GET(request: Request) {
  if (!validateVaultKey(request)) return unauthorizedResponse();

  const ids = (await kv.smembers("archived_files")) as string[];

  const files = await Promise.all(
    ids.map(async (id) => {
      const record = (await kv.hgetall(`file:${id}`)) as VaultFile | null;
      return record;
    })
  );

  const archived = files
    .filter((file): file is VaultFile => Boolean(file))
    .filter((file) => file.status === "archived")
    .map((file) => ({
      id: file.id,
      assetLocalIdentifier: file.assetLocalIdentifier,
      filename: file.filename,
      archivedAt: file.archivedAt,
    }))
    .filter((file) => Boolean(file.assetLocalIdentifier));

  return Response.json(archived);
}