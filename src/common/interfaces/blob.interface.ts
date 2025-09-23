export interface BlobInfo {
  name: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  versionId?: string;
  metadata: Record<string, string>;
}

export interface BlobUploadResult {
  id: string;
  container: string;
  blobName: string;
  url: string;
  etag: string;
  versionId?: string;
  size: number;
  contentType: string;
  metadata: Record<string, string>;
}

export interface BlobListResult {
  items: BlobInfo[];
  continuationToken?: string;
}

export interface SasUrlResult {
  sasUrl: string;
  expiresAt: string;
}

export interface BlobCopyOptions {
  source: {
    container: string;
    blobName: string;
  };
  target: {
    container: string;
    blobName: string;
  };
  move?: boolean;
  metadata?: Record<string, string>;
}

export interface BlobDownloadResult {
  readableStreamBody?: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}
