import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  ContainerListBlobsOptions,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  BlobHTTPHeaders,
  BlobItem,
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { Readable } from 'stream';
import { env } from '../config/env';
import { createErrorFromStorageError } from './errors';
import { Logger } from './logger';

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

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.blobServiceClient = this.createBlobServiceClient();
  }

  private createBlobServiceClient(): BlobServiceClient {
    if (env.AZURE_STORAGE_CONNECTION_STRING) {
      return BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING);
    }

    if (env.AZURE_STORAGE_ACCOUNT) {
      const credential = new DefaultAzureCredential();
      const accountUrl = `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
      return new BlobServiceClient(accountUrl, credential);
    }

    throw new Error('No storage configuration found. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT');
  }

  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName);
  }

  private getBlobClient(containerName: string, blobName: string): BlockBlobClient {
    return this.getContainerClient(containerName).getBlockBlobClient(blobName);
  }

  async ensureContainer(containerName: string): Promise<void> {
    try {
      const containerClient = this.getContainerClient(containerName);
      await containerClient.createIfNotExists({
        access: 'blob',
      });
      this.logger.debug(`Container ensured: ${containerName}`);
    } catch (error) {
      this.logger.error(`Failed to ensure container: ${containerName}`, error);
      throw error;
    }
  }

  async uploadBlob(
    containerName: string,
    blobName: string,
    content: Buffer | Readable,
    contentType: string,
    metadata?: Record<string, string>,
    requestId?: string
  ): Promise<BlobUploadResult> {
    try {
      await this.ensureContainer(containerName);

      const blobClient = this.getBlobClient(containerName, blobName);

      const blobHttpHeaders: BlobHTTPHeaders = {
        blobContentType: contentType,
      };

      const uploadOptions = {
        blobHTTPHeaders: blobHttpHeaders,
        metadata: metadata || {},
        tags: requestId ? { requestId } : undefined,
      };

      let uploadResponse;

      if (content instanceof Buffer) {
        uploadResponse = await blobClient.upload(content, content.length, uploadOptions);
      } else {
        uploadResponse = await blobClient.uploadStream(content as Readable, undefined, undefined, uploadOptions);
      }

      const properties = await blobClient.getProperties();

      const result: BlobUploadResult = {
        id: encodeURIComponent(`${containerName}/${blobName}`),
        container: containerName,
        blobName,
        url: blobClient.url,
        etag: uploadResponse.etag!,
        versionId: uploadResponse.versionId,
        size: properties.contentLength || 0,
        contentType: properties.contentType || contentType,
        metadata: properties.metadata || {},
      };

      this.logger.info(`Blob uploaded successfully`, {
        container: containerName,
        blobName,
        size: result.size,
        requestId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to upload blob`, error, {
        container: containerName,
        blobName,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async downloadBlob(
    containerName: string,
    blobName: string,
    range?: { start: number; end: number },
    requestId?: string
  ): Promise<BlobDownloadResponseParsed> {
    try {
      const blobClient = this.getBlobClient(containerName, blobName);

      const downloadResponse = range 
        ? await blobClient.download(range.start, range.end - range.start + 1)
        : await blobClient.download();

      this.logger.info(`Blob downloaded successfully`, {
        container: containerName,
        blobName,
        size: downloadResponse.contentLength,
        requestId,
      });

      return downloadResponse;
    } catch (error) {
      this.logger.error(`Failed to download blob`, error, {
        container: containerName,
        blobName,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async deleteBlob(containerName: string, blobName: string, requestId?: string): Promise<void> {
    try {
      const blobClient = this.getBlobClient(containerName, blobName);
      await blobClient.delete();

      this.logger.info(`Blob deleted successfully`, {
        container: containerName,
        blobName,
        requestId,
      });
    } catch (error) {
      this.logger.error(`Failed to delete blob`, error, {
        container: containerName,
        blobName,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async listBlobs(
    containerName: string,
    prefix?: string,
    maxResults = 100,
    continuationToken?: string,
    requestId?: string
  ): Promise<BlobListResult> {
    try {
      const containerClient = this.getContainerClient(containerName);

      const listOptions: ContainerListBlobsOptions = {
        prefix,
        includeTags: true,
        includeMetadata: true,
        includeVersions: false,
      };

      const iterator = containerClient.listBlobsFlat(listOptions).byPage({
        maxPageSize: maxResults,
        continuationToken,
      });

      const page = await iterator.next();
      const blobs = page.value;

      const items: BlobInfo[] = blobs.segment.blobItems.map((blob: BlobItem) => ({
        name: blob.name,
        url: `${containerClient.url}/${blob.name}`,
        size: blob.properties.contentLength || 0,
        contentType: blob.properties.contentType || 'application/octet-stream',
        lastModified: blob.properties.lastModified!,
        etag: blob.properties.etag!,
        versionId: blob.versionId,
        metadata: blob.metadata || {},
      }));

      const result: BlobListResult = {
        items,
        continuationToken: blobs.continuationToken,
      };

      this.logger.info(`Blobs listed successfully`, {
        container: containerName,
        count: items.length,
        hasMore: !!blobs.continuationToken,
        requestId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to list blobs`, error, {
        container: containerName,
        prefix,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async generateSasUrl(
    containerName: string,
    blobName: string,
    permissions: string,
    expiresInSeconds: number,
    requestId?: string
  ): Promise<SasUrlResult> {
    try {
      if (!env.AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error('SAS generation requires connection string');
      }

      const connectionStringMatch = env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
      if (!connectionStringMatch) {
        throw new Error('Invalid connection string format');
      }

      const accountName = connectionStringMatch[1];
      const accountKey = connectionStringMatch[2];
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

      const blobClient = this.getBlobClient(containerName, blobName);

      const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);

      const blobSAS = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse(permissions),
          expiresOn,
        },
        sharedKeyCredential
      );

      const sasUrl = `${blobClient.url}?${blobSAS}`;

      const result: SasUrlResult = {
        sasUrl,
        expiresAt: expiresOn.toISOString(),
      };

      this.logger.info(`SAS URL generated successfully`, {
        container: containerName,
        blobName,
        permissions,
        expiresAt: result.expiresAt,
        requestId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate SAS URL`, error, {
        container: containerName,
        blobName,
        permissions,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async copyBlob(options: BlobCopyOptions, requestId?: string): Promise<BlobUploadResult> {
    try {
      const sourceBlobClient = this.getBlobClient(options.source.container, options.source.blobName);
      const targetBlobClient = this.getBlobClient(options.target.container, options.target.blobName);

      await this.ensureContainer(options.target.container);

      const copyResult = await targetBlobClient.syncCopyFromURL(sourceBlobClient.url, {
        metadata: options.metadata,
      });

      if (options.move) {
        await this.deleteBlob(options.source.container, options.source.blobName, requestId);
      }

      const properties = await targetBlobClient.getProperties();

      const result: BlobUploadResult = {
        id: encodeURIComponent(`${options.target.container}/${options.target.blobName}`),
        container: options.target.container,
        blobName: options.target.blobName,
        url: targetBlobClient.url,
        etag: copyResult.etag!,
        versionId: copyResult.versionId,
        size: properties.contentLength || 0,
        contentType: properties.contentType || 'application/octet-stream',
        metadata: properties.metadata || {},
      };

      this.logger.info(`Blob ${options.move ? 'moved' : 'copied'} successfully`, {
        sourceContainer: options.source.container,
        sourceBlobName: options.source.blobName,
        targetContainer: options.target.container,
        targetBlobName: options.target.blobName,
        move: options.move,
        requestId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to ${options.move ? 'move' : 'copy'} blob`, error, {
        sourceContainer: options.source.container,
        sourceBlobName: options.source.blobName,
        targetContainer: options.target.container,
        targetBlobName: options.target.blobName,
        requestId,
      });
      throw createErrorFromStorageError(error as Error, requestId || 'unknown');
    }
  }

  async blobExists(containerName: string, blobName: string): Promise<boolean> {
    try {
      const blobClient = this.getBlobClient(containerName, blobName);
      return await blobClient.exists();
    } catch {
      return false;
    }
  }
}