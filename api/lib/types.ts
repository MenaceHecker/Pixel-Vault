export interface VaultFile {
  id: string;
  filename: string;
  takenAt: string;
  uploadedAt: string;
  status: "pending" | "done";
  blobUrl: string;
  size: number;
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
  status: "done";
}

export interface PendingResponse {
  files: PendingFile[];
}
