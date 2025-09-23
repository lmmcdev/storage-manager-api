// Simple mock implementations without complex typing issues

// Mock Azure Storage Blob
const mockBlobServiceClient = {
  fromConnectionString: jest.fn(),
  getContainerClient: jest.fn(),
};

const mockContainerClient = {
  createIfNotExists: jest.fn(),
  getBlockBlobClient: jest.fn(),
  listBlobsFlat: jest.fn(),
  url: 'https://testaccount.blob.core.windows.net/test-container',
};

const mockBlockBlobClient = {
  upload: jest.fn(),
  uploadStream: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getProperties: jest.fn(),
  syncCopyFromURL: jest.fn(),
  url: 'https://testaccount.blob.core.windows.net/test-container/test-blob',
};

// Mock Azure Identity
const mockDefaultAzureCredential = jest.fn();
const mockClientSecretCredential = jest.fn();

// Mock Microsoft Graph
const mockGraphClient = {
  api: jest.fn(),
};

// Setup mocks
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: mockBlobServiceClient,
  BlobSASPermissions: {
    parse: jest.fn(),
  },
  generateBlobSASQueryParameters: jest.fn(),
  StorageSharedKeyCredential: jest.fn(),
}));

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: mockDefaultAzureCredential,
  ClientSecretCredential: mockClientSecretCredential,
}));

jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn(),
  },
}));

jest.mock('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials', () => ({
  TokenCredentialAuthenticationProvider: jest.fn(),
}));