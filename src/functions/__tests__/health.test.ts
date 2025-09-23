import { InvocationContext } from '@azure/functions';
import { createMockRequest } from '../../test/helpers';

// Mock the blob storage service to avoid actual Azure calls
jest.mock('../../shared/blob');

describe('Health Check', () => {
  let healthCheck: any;

  beforeAll(async () => {
    // Import the function after mocking dependencies
    const module = await import('../health.function');
    // Extract the handler from the app registration
    healthCheck = (module as any).default?.handler || module.healthCheck;
  });

  it('should return healthy status when storage is accessible', async () => {
    const mockRequest = createMockRequest();
    const mockContext = {} as InvocationContext;

    // Mock successful storage check
    const mockBlobStorageService = require('../../shared/blob').BlobStorageService;
    mockBlobStorageService.mockImplementation(() => ({
      blobServiceClient: {
        listContainers: () => ({
          next: () => Promise.resolve({ value: [] })
        })
      }
    }));

    const response = await healthCheck(mockRequest, mockContext);

    expect(response.status).toBe(200);
    expect(response.jsonBody.data.status).toBe('healthy');
    expect(response.jsonBody.data.services.storage.status).toBe('healthy');
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
  });

  it('should return unhealthy status when storage is not accessible', async () => {
    const mockRequest = createMockRequest();
    const mockContext = {} as InvocationContext;

    // Mock failed storage check
    const mockBlobStorageService = require('../../shared/blob').BlobStorageService;
    mockBlobStorageService.mockImplementation(() => ({
      blobServiceClient: {
        listContainers: () => ({
          next: () => Promise.reject(new Error('Storage connection failed'))
        })
      }
    }));

    const response = await healthCheck(mockRequest, mockContext);

    expect(response.status).toBe(503);
    expect(response.jsonBody.data.status).toBe('unhealthy');
    expect(response.jsonBody.data.services.storage.status).toBe('unhealthy');
    expect(response.jsonBody.data.services.storage.message).toBe('Storage connection failed');
  });

  it('should handle OPTIONS requests', async () => {
    const mockRequest = createMockRequest({}, 'OPTIONS');
    const mockContext = {} as InvocationContext;

    const response = await healthCheck(mockRequest, mockContext);

    expect(response.status).toBe(200);
    expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
  });
});