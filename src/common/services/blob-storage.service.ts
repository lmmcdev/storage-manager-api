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
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { Readable } from 'stream';
import { env } from '../config/env';
import {
  BlobInfo,
  BlobUploadResult,
  BlobListResult,
  SasUrlResult,
  BlobCopyOptions,
  BlobDownloadResult,
} from '../interfaces/blob.interface';

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = this.createBlobServiceClient();
  }

  private createBlobServiceClient(): BlobServiceClient {
    if (env.AZURE_STORAGE_CONNECTION_STRING) {
      return BlobServiceClient.fromConnectionString(
        env.AZURE_STORAGE_CONNECTION_STRING
      );
    }

    if (env.AZURE_STORAGE_ACCOUNT) {
      const credential = new DefaultAzureCredential();
      const accountUrl = `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
      return new BlobServiceClient(accountUrl, credential);
    }

    throw new Error(
      'No storage configuration found. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT'
    );
  }

  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName);
  }

  private getBlobClient(
    containerName: string,
    blobName: string
  ): BlockBlobClient {
    return this.getContainerClient(containerName).getBlockBlobClient(blobName);
  }

  async ensureContainer(containerName: string): Promise<void> {
    try {
      const containerClient = this.getContainerClient(containerName);
      await containerClient.createIfNotExists({
        access: 'blob',
      });
    } catch (error) {
      console.error(`Failed to ensure container: ${containerName}`, error);
      throw error;
    }
  }

  async uploadBlob(
    containerName: string,
    blobName: string,
    content: Buffer | Readable,
    contentType: string,
    metadata?: Record<string, string>
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
      };

      let uploadResponse;

      if (content instanceof Buffer) {
        uploadResponse = await blobClient.upload(
          content,
          content.length,
          uploadOptions
        );
      } else {
        uploadResponse = await blobClient.uploadStream(
          content as Readable,
          undefined,
          undefined,
          uploadOptions
        );
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

      return result;
    } catch (error) {
      console.error(`Failed to upload blob`, error);
      throw error;
    }
  }

  async downloadBlob(
    containerName: string,
    blobName: string,
    range?: { start: number; end: number }
  ): Promise<BlobDownloadResult> {
    try {
      const blobClient = this.getBlobClient(containerName, blobName);

      let downloadResponse;
      if (range) {
        downloadResponse = await blobClient.download(
          range.start,
          range.end - range.start + 1
        );
      } else {
        downloadResponse = await blobClient.download();
      }

      return {
        readableStreamBody:
          downloadResponse.readableStreamBody as NodeJS.ReadableStream,
        contentType: downloadResponse.contentType,
        contentLength: downloadResponse.contentLength,
        etag: downloadResponse.etag,
        lastModified: downloadResponse.lastModified,
        metadata: downloadResponse.metadata,
      };
    } catch (error) {
      console.error(`Failed to download blob`, error);
      throw error;
    }
  }

  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    try {
      const blobClient = this.getBlobClient(containerName, blobName);
      await blobClient.delete();
    } catch (error) {
      console.error(`Failed to delete blob`, error);
      throw error;
    }
  }

  async listBlobs(
    containerName: string,
    prefix?: string,
    maxResults = 100,
    continuationToken?: string
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

      const items: BlobInfo[] = blobs.segment.blobItems.map((blob: any) => ({
        id: encodeURIComponent(`${containerName}/${blob.name}`),
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

      return result;
    } catch (error) {
      console.error(`Failed to list blobs`, error);
      throw error;
    }
  }

  async generateSasUrl(
    containerName: string,
    blobName: string,
    permissions: string,
    expiresInSeconds: number
  ): Promise<SasUrlResult> {
    try {
      if (!env.AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error('SAS generation requires connection string');
      }

      const connectionStringMatch = env.AZURE_STORAGE_CONNECTION_STRING.match(
        /AccountName=([^;]+);AccountKey=([^;]+)/
      );
      if (!connectionStringMatch) {
        throw new Error('Invalid connection string format');
      }

      const accountName = connectionStringMatch[1];
      const accountKey = connectionStringMatch[2];
      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey
      );

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

      return result;
    } catch (error) {
      console.error(`Failed to generate SAS URL`, error);
      throw error;
    }
  }

  async copyBlob(options: BlobCopyOptions): Promise<BlobUploadResult> {
    try {
      const sourceBlobClient = this.getBlobClient(
        options.source.container,
        options.source.blobName
      );
      const targetBlobClient = this.getBlobClient(
        options.target.container,
        options.target.blobName
      );

      await this.ensureContainer(options.target.container);

      const copyResult = await targetBlobClient.syncCopyFromURL(
        sourceBlobClient.url,
        {
          metadata: options.metadata,
        }
      );

      if (options.move) {
        await this.deleteBlob(
          options.source.container,
          options.source.blobName
        );
      }

      const properties = await targetBlobClient.getProperties();

      const result: BlobUploadResult = {
        id: encodeURIComponent(
          `${options.target.container}/${options.target.blobName}`
        ),
        container: options.target.container,
        blobName: options.target.blobName,
        url: targetBlobClient.url,
        etag: copyResult.etag!,
        versionId: copyResult.versionId,
        size: properties.contentLength || 0,
        contentType: properties.contentType || 'application/octet-stream',
        metadata: properties.metadata || {},
      };

      return result;
    } catch (error) {
      console.error(`Failed to ${options.move ? 'move' : 'copy'} blob`, error);
      throw error;
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
