/**
 * Files Service Tests
 */

import { FilesService } from '../services/files.service';
import { BlobStorageService } from '../../../common/services/blob-storage.service';

// Mock the BlobStorageService
jest.mock('../../../common/services/blob-storage.service');

describe('FilesService', () => {
  let filesService: FilesService;
  let mockBlobStorageService: jest.Mocked<BlobStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new instance for each test
    filesService = new FilesService();

    // Get the mocked instance
    mockBlobStorageService = jest.mocked(filesService['blobStorageService']);
  });

  describe('validateFileName', () => {
    it('should validate valid file names', () => {
      expect(filesService.validateFileName('test.txt')).toBe(true);
      expect(filesService.validateFileName('my-file.pdf')).toBe(true);
      expect(filesService.validateFileName('image_2023.jpg')).toBe(true);
    });

    it('should reject invalid file names', () => {
      expect(filesService.validateFileName('')).toBe(false);
      expect(filesService.validateFileName('file<name>.txt')).toBe(false);
      expect(filesService.validateFileName('CON')).toBe(false); // Reserved name without extension
      expect(filesService.validateFileName('.hidden')).toBe(false);
      expect(filesService.validateFileName('file.')).toBe(false);
    });

    it('should reject file names that are too long', () => {
      const longName = 'a'.repeat(256) + '.txt';
      expect(filesService.validateFileName(longName)).toBe(false);
    });
  });

  describe('validateContainerName', () => {
    it('should validate valid container names', () => {
      expect(filesService.validateContainerName('mycontainer')).toBe(true);
      expect(filesService.validateContainerName('test-container-123')).toBe(true);
      expect(filesService.validateContainerName('abc')).toBe(true);
    });

    it('should reject invalid container names', () => {
      expect(filesService.validateContainerName('ab')).toBe(false); // too short
      expect(filesService.validateContainerName('MyContainer')).toBe(false); // uppercase
      expect(filesService.validateContainerName('container--name')).toBe(false); // double dashes
      expect(filesService.validateContainerName('-container')).toBe(false); // starts with dash
      expect(filesService.validateContainerName('container-')).toBe(false); // ends with dash
    });

    it('should reject container names that are too long', () => {
      const longName = 'a'.repeat(64);
      expect(filesService.validateContainerName(longName)).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('should upload file with correct parameters', async () => {
      const mockResult = {
        id: 'test-id',
        container: 'uploads',
        blobName: 'test-path/test.txt',
        url: 'https://test.blob.core.windows.net/uploads/test-path/test.txt',
        etag: 'test-etag',
        versionId: 'test-version',
        size: 1024,
        contentType: 'text/plain',
        metadata: {},
      };

      mockBlobStorageService.uploadBlob = jest.fn().mockResolvedValue(mockResult);

      const buffer = Buffer.from('test content');
      const result = await filesService.uploadFile(
        'uploads',
        'test-path',
        'test.txt',
        buffer,
        'text/plain',
        { author: 'test' }
      );

      expect(mockBlobStorageService.uploadBlob).toHaveBeenCalledWith(
        'uploads',
        'test-path/test.txt',
        buffer,
        'text/plain',
        { author: 'test' }
      );
      expect(result).toEqual(mockResult);
    });

    it('should use default container when not provided', async () => {
      mockBlobStorageService.uploadBlob = jest.fn().mockResolvedValue({} as any);

      const buffer = Buffer.from('test content');
      await filesService.uploadFile(
        undefined,
        'test-path',
        'test.txt',
        buffer,
        'text/plain'
      );

      expect(mockBlobStorageService.uploadBlob).toHaveBeenCalledWith(
        'uploads', // Default fallback value
        'test-path/test.txt',
        buffer,
        'text/plain',
        undefined
      );
    });
  });

  describe('fileExists', () => {
    it('should check if file exists', async () => {
      mockBlobStorageService.blobExists = jest.fn().mockResolvedValue(true);

      const result = await filesService.fileExists('uploads', 'test.txt');

      expect(mockBlobStorageService.blobExists).toHaveBeenCalledWith('uploads', 'test.txt');
      expect(result).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      mockBlobStorageService.deleteBlob = jest.fn().mockResolvedValue(undefined);

      await filesService.deleteFile('uploads', 'test.txt');

      expect(mockBlobStorageService.deleteBlob).toHaveBeenCalledWith('uploads', 'test.txt');
    });
  });
});