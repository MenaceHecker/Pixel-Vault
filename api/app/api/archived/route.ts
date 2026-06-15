import { kv } from "@/lib/kv";
import { validateVaultKey, unauthorizedResponse } from "@/lib/auth";
import type { ArchivedFile, VaultFile } from "@/lib/types";

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

  const archived: ArchivedFile[] = files
    .filter(
      (
        file
      ): file is VaultFile & {
        status: "archived";
        assetLocalIdentifier: string;
        archivedAt: string;
      } =>
        file?.status === "archived" &&
        typeof file.assetLocalIdentifier === "string" &&
        file.assetLocalIdentifier !== "" &&
        typeof file.archivedAt === "string" &&
        file.archivedAt !== ""
    )
    .map((file) => ({
      id: file.id,
      assetLocalIdentifier: file.assetLocalIdentifier,
      filename: file.filename,
      archivedAt: file.archivedAt,
    }));

  return Response.json(archived);
}
