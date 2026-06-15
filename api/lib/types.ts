export interface VaultFile {
  id: string;
  filename: string;
  takenAt: string;
  uploadedAt: string;
  status: "pending" | "archived";
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
  status: "archived";
}

export interface PendingResponse {
  files: PendingFile[];
}
