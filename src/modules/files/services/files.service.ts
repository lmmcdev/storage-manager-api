/**
 * Files Service
 *
 * Business logic layer for file operations
 */

import { BlobStorageService } from '../../../common/services/blob-storage.service';
import {
  BlobUploadResult,
  BlobListResult,
  SasUrlResult,
  BlobCopyOptions,
  BlobDownloadResult,
} from '../../../common/interfaces/blob.interface';
import { generateDatePath } from '../../../common/utils/http.util';
import { env } from '../../../common/config/env';

export class FilesService {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async uploadFile(
    container: string | undefined,
    path: string | undefined,
    fileName: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<BlobUploadResult> {
    const targetContainer = container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
    const targetPath = path || generateDatePath();
    const blobName = `${targetPath}/${fileName}`;

    return this.blobStorageService.uploadBlob(
      targetContainer,
      blobName,
      content,
      contentType,
      metadata
    );
  }

  async listFiles(
    container?: string,
    prefix?: string,
    maxResults = 100,
    continuationToken?: string
  ): Promise<BlobListResult> {
    const targetContainer = container || env.AZURE_STORAGE_CONTAINER_DEFAULT;

    return this.blobStorageService.listBlobs(
      targetContainer,
      prefix,
      maxResults,
      continuationToken
    );
  }

  async getFileStream(
    container: string,
    blobPath: string,
    range?: { start: number; end: number }
  ): Promise<BlobDownloadResult> {
    return this.blobStorageService.downloadBlob(container, blobPath, range);
  }

  async deleteFile(container: string, blobPath: string): Promise<void> {
    await this.blobStorageService.deleteBlob(container, blobPath);
  }

  async copyFile(options: BlobCopyOptions): Promise<BlobUploadResult> {
    return this.blobStorageService.copyBlob(options);
  }

  async generateSasUrl(
    container: string,
    blobPath: string,
    permissions: string,
    expiresInSeconds: number
  ): Promise<SasUrlResult> {
    return this.blobStorageService.generateSasUrl(
      container,
      blobPath,
      permissions,
      expiresInSeconds
    );
  }

  async fileExists(container: string, blobPath: string): Promise<boolean> {
    return this.blobStorageService.blobExists(container, blobPath);
  }

  validateFileName(fileName: string): boolean {
    // Basic file name validation
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

    return (
      fileName.length > 0 &&
      fileName.length <= 255 &&
      !invalidChars.test(fileName) &&
      !reservedNames.test(fileName) &&
      !fileName.startsWith('.') &&
      !fileName.endsWith('.')
    );
  }

  validateContainerName(containerName: string): boolean {
    // Container name validation rules for Azure Blob Storage
    const validFormat = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    return (
      containerName.length >= 3 &&
      containerName.length <= 63 &&
      validFormat.test(containerName) &&
      !containerName.includes('--')
    );
  }
}
