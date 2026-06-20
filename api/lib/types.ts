export interface VaultFile {
  id: string;
  filename: string;
  takenAt: string;
  uploadedAt: string;
  status: "pending" | "archived";
  blobUrl: string;
  size: number;
  assetLocalIdentifier?: string;
  archivedAt?: string;
  confirmedAt?: string;
}

export interface PendingFile {
  id: string;
  url: string;
  filename: string;
  takenAt: string;
  size: number;
}

export interface UploadResponse {
  id: string;
  status: "pending";
}

export interface ConfirmResponse {
  id: string;
  status: "archived";
}

export interface PendingResponse {
  files: PendingFile[];
}

export interface ArchivedFile {
  id: string;
  assetLocalIdentifier: string;
  filename: string;
  archivedAt: string;
}

export interface VaultFile {
  id: string;
  filename: string;
  assetLocalIdentifier?: string;
  mediaType?: string;

  checksum: string;

  takenAt: string;
  uploadedAt: string;
  archivedAt?: string | null;
  deletedFromIphoneAt?: string | null;

  status: VaultFileStatus;

  blobUrl: string;
  size: number;
}
