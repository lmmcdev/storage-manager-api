/**
 * Files Upload Controller Tests
 */

import { HttpRequest } from '@azure/functions';
import { FilesUploadController } from '../controllers/files-upload.controller';
import { BlobStorageService } from '../../../common/services/blob-storage.service';

// Mock dependencies
jest.mock('../../../common/services/blob-storage.service');

describe('FilesUploadController', () => {
  let controller: FilesUploadController;
  let mockBlobStorageService: jest.Mocked<BlobStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FilesUploadController();
    mockBlobStorageService = jest.mocked(controller['blobStorageService']);
  });

  describe('uploadForm', () => {
    it('should handle OPTIONS request', async () => {
      const mockRequest = {
        method: 'OPTIONS',
        headers: new Map(),
      } as unknown as HttpRequest;

      const response = await controller.uploadForm(mockRequest, {} as any);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
    });
  });

  describe('uploadJson', () => {
    it('should handle OPTIONS request', async () => {
      const mockRequest = {
        method: 'OPTIONS',
        headers: new Map(),
      } as unknown as HttpRequest;

      const response = await controller.uploadJson(mockRequest, {} as any);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
    });
  });
});