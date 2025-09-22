# Storage Manager API

A production-ready Azure Functions API for comprehensive file storage management with Azure Blob Storage. This API provides secure, scalable endpoints for uploading, downloading, listing, and managing files with built-in authentication, validation, and monitoring.

## 🚀 Features

- **Complete File Management**: Upload, download, delete, list, copy/move files
- **Multiple Authentication Methods**: API Key and Azure AD (Easy Auth) support
- **Secure Operations**: Role-based access control and input validation
- **Production Ready**: Structured logging, error handling, CORS support
- **Streaming Support**: Efficient handling of large files without memory loading
- **SAS Token Generation**: Controlled access with signed URLs
- **Range Requests**: Support for partial downloads and resumable transfers
- **Metadata Support**: Custom metadata for files and folders
- **TypeScript**: Full type safety with strict compilation
- **Comprehensive Testing**: Unit and integration tests with Jest

## 🛠️ Prerequisites

- Node.js 18.x or higher
- Azure Functions Core Tools v4
- Azure Storage Account
- Azure subscription (for deployment)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd storage-manager-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see [Configuration](#configuration) section)

4. Start development server:
```bash
npm start
```

## 🔧 Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and recompile automatically
- `npm run clean` - Remove the dist directory
- `npm start` - Start the Azure Functions runtime locally
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run typecheck` - Run TypeScript type checking

### Local Development

1. Copy and configure local settings:
```bash
cp local.settings.json.example local.settings.json
```

2. Start the development server:
```bash
npm start
```

3. The API will be available at `http://localhost:7071/api/v1`

## 📁 Project Structure

```
storage-manager-api/
├── src/
│   ├── functions/              # Azure Functions endpoints
│   │   ├── files-upload.function.ts
│   │   ├── files-get.function.ts
│   │   ├── files-delete.function.ts
│   │   ├── files-list.function.ts
│   │   ├── files-sas.function.ts
│   │   └── files-copy.function.ts
│   ├── shared/                 # Shared utilities
│   │   ├── env.ts             # Environment configuration
│   │   ├── logger.ts          # Structured logging
│   │   ├── auth.ts            # Authentication & authorization
│   │   ├── errors.ts          # Error handling
│   │   ├── http.ts            # HTTP helpers
│   │   ├── validation.ts      # Input validation
│   │   └── blob.ts            # Azure Blob Storage wrapper
│   ├── schemas/               # Zod validation schemas
│   │   ├── upload.dto.ts
│   │   ├── list.dto.ts
│   │   ├── sas.dto.ts
│   │   ├── copy.dto.ts
│   │   └── common.dto.ts
│   └── test/                  # Test setup and utilities
├── dist/                      # Compiled JavaScript output
├── coverage/                  # Test coverage reports
├── examples/                  # API usage examples
├── host.json                  # Azure Functions host configuration
├── local.settings.json        # Local development settings
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest testing configuration
└── package.json              # Project dependencies and scripts
```

## 🔐 Configuration

### Environment Variables

Configure these environment variables in `local.settings.json` for local development or in Azure Application Settings for production:

#### Required Variables

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",

    // Storage Configuration (choose one)
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=...",
    // OR
    "AZURE_STORAGE_ACCOUNT": "mystorageaccount",

    // Default container
    "AZURE_STORAGE_CONTAINER_DEFAULT": "uploads",

    // Authentication Mode: "apikey" or "aad"
    "AUTH_MODE": "apikey",

    // API Keys (for apikey mode)
    "API_KEYS": "your-api-key-1,your-api-key-2",

    // Authorization roles
    "ALLOWED_ROLES": "files.read,files.write,files.delete,files.sas",

    // CORS configuration
    "CORS_ALLOWED_ORIGINS": "http://localhost:3000,https://yourapp.com",

    // SAS token defaults
    "SAS_DEFAULT_EXP_SECONDS": "900",

    // Logging
    "LOG_LEVEL": "info",
    "REDACT_SECRETS": "true"
  }
}
```

### Authentication Modes

#### API Key Authentication
```bash
# Set authentication mode
AUTH_MODE=apikey
API_KEYS=key1,key2,key3

# Use in requests
curl -H "x-api-key: key1" http://localhost:7071/api/v1/files/list
```

#### Azure AD Authentication
```bash
# Set authentication mode
AUTH_MODE=aad

# Configure Easy Auth on your Function App
# Use Bearer tokens in requests
curl -H "Authorization: Bearer <jwt-token>" http://localhost:7071/api/v1/files/list
```

## 🌐 API Endpoints

### Base URL: `/api/v1/files`

### 1. Upload File

**POST** `/upload`

Upload files using multipart form data or JSON base64.

#### Multipart Upload:
```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  -F "file=@document.pdf" \
  -F "container=documents" \
  -F "path=2024/invoices" \
  -F "metadata={\"category\":\"invoice\",\"department\":\"finance\"}" \
  http://localhost:7071/api/v1/files/upload
```

#### JSON Upload:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "contentBase64": "SGVsbG8gV29ybGQ=",
    "filename": "hello.txt",
    "contentType": "text/plain",
    "container": "documents",
    "path": "2024/text-files"
  }' \
  http://localhost:7071/api/v1/files/upload
```

### 2. Download File

**GET** `/{container}/{blobPath}`

Download files with support for range requests.

```bash
# Regular download
curl -H "x-api-key: your-api-key" \
  http://localhost:7071/api/v1/files/documents/2024/invoices/document.pdf

# Force download (Content-Disposition: attachment)
curl -H "x-api-key: your-api-key" \
  "http://localhost:7071/api/v1/files/documents/2024/invoices/document.pdf?download=1"

# Range request (partial download)
curl -H "x-api-key: your-api-key" \
  -H "Range: bytes=0-1023" \
  http://localhost:7071/api/v1/files/documents/2024/invoices/document.pdf
```

### 3. Delete File

**DELETE** `/{container}/{blobPath}`

```bash
curl -X DELETE \
  -H "x-api-key: your-api-key" \
  http://localhost:7071/api/v1/files/documents/2024/invoices/document.pdf
```

### 4. List Files

**GET** `/list`

List files with pagination and filtering.

```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:7071/api/v1/files/list?container=documents&prefix=2024/invoices&max=50"
```

### 5. Generate SAS URL

**POST** `/sas`

Generate signed URLs for controlled access.

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "container": "documents",
    "blobName": "2024/invoices/document.pdf",
    "permissions": "r",
    "expiresInSeconds": 3600
  }' \
  http://localhost:7071/api/v1/files/sas
```

### 6. Copy/Move Files

**PUT** `/copy`

Copy or move files between locations.

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "source": {
      "container": "documents",
      "blobName": "temp/document.pdf"
    },
    "target": {
      "container": "archive",
      "blobName": "2024/archived/document.pdf"
    },
    "move": true,
    "metadata": {
      "archived": "2024-01-15",
      "originalLocation": "temp"
    }
  }' \
  http://localhost:7071/api/v1/files/copy
```

## 🔒 Security & Permissions

### Role-Based Access Control

- `files.read` - Download and list files
- `files.write` - Upload and copy files
- `files.delete` - Delete files and move operations
- `files.sas` - Generate SAS tokens

### Azure Storage Permissions

#### Managed Identity (Recommended for Production)
```bash
# Assign Storage Blob Data Contributor role to your Function App's Managed Identity
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <function-app-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>
```

#### Connection String (Development Only)
For local development, use the storage account connection string in `local.settings.json`.

### Enable Blob Features

Enable versioning and soft delete on your storage account:

```bash
# Enable versioning
az storage account blob-service-properties update \
  --account-name <storage-account-name> \
  --enable-versioning true

# Enable soft delete
az storage account blob-service-properties update \
  --account-name <storage-account-name> \
  --enable-delete-retention true \
  --delete-retention-days 7
```

## 🚀 Deployment

### Deploy to Azure

1. Create Azure resources:
```bash
# Create resource group
az group create --name myResourceGroup --location eastus

# Create storage account
az storage account create \
  --name mystorageaccount \
  --resource-group myResourceGroup \
  --location eastus \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --resource-group myResourceGroup \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name myfileapi \
  --storage-account mystorageaccount
```

2. Configure application settings:
```bash
az functionapp config appsettings set \
  --name myfileapi \
  --resource-group myResourceGroup \
  --settings \
    AUTH_MODE=apikey \
    API_KEYS="prod-key-1,prod-key-2" \
    AZURE_STORAGE_ACCOUNT=mystorageaccount \
    CORS_ALLOWED_ORIGINS="https://myapp.com"
```

3. Deploy the function:
```bash
npm run build
func azure functionapp publish myfileapi
```

### Configure Easy Auth (Azure AD)

1. Enable App Service Authentication:
```bash
az webapp auth config \
  --name myfileapi \
  --resource-group myResourceGroup \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

2. Update environment variables:
```bash
az functionapp config appsettings set \
  --name myfileapi \
  --resource-group myResourceGroup \
  --settings AUTH_MODE=aad
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test complete request flows
- **Validation Tests**: Test input validation and schemas

### Example Test

```typescript
describe('File Upload', () => {
  it('should upload file successfully', async () => {
    const mockRequest = createMockRequest({
      method: 'POST',
      headers: { 'x-api-key': 'test-key' },
      body: mockFormData
    });

    const response = await filesUpload(mockRequest, mockContext);

    expect(response.status).toBe(201);
    expect(response.jsonBody.data).toHaveProperty('blobName');
  });
});
```

## 📊 Monitoring & Logging

### Application Insights

The API integrates with Azure Application Insights for monitoring:

- Request/response tracking
- Performance metrics
- Error logging
- Custom telemetry

### Structured Logging

All operations are logged with structured data:

```typescript
logger.info('File uploaded successfully', {
  container: 'documents',
  blobName: '2024/invoice.pdf',
  size: 1024000,
  contentType: 'application/pdf',
  requestId: 'abc-123-def'
});
```

### Log Levels

- `error` - Errors and exceptions
- `warn` - Warnings and non-critical issues
- `info` - General information
- `debug` - Detailed debugging information

## 🔧 Troubleshooting

### Common Issues

#### Authentication Failures
```bash
# Check API key configuration
echo $API_KEYS

# Verify request headers
curl -v -H "x-api-key: your-key" http://localhost:7071/api/v1/files/list
```

#### Storage Connection Issues
```bash
# Test storage connectivity
az storage blob list --account-name <account> --container-name uploads --auth-mode login

# Verify managed identity permissions
az role assignment list --assignee <function-app-principal-id> --scope <storage-scope>
```

#### CORS Issues
```bash
# Check CORS configuration
az functionapp config cors show --name myfileapi --resource-group myResourceGroup

# Update CORS settings
az functionapp config cors add --name myfileapi --resource-group myResourceGroup --allowed-origins https://myapp.com
```

### Debug Mode

Enable debug logging:
```json
{
  "LOG_LEVEL": "debug"
}
```

## 📋 API Response Examples

### Success Response
```json
{
  "data": {
    "id": "uploads%2F2024%2F01%2F15%2Fdocument.pdf",
    "container": "uploads",
    "blobName": "2024/01/15/document.pdf",
    "url": "https://mystorageaccount.blob.core.windows.net/uploads/2024/01/15/document.pdf",
    "etag": "\"0x8D9F8...",
    "size": 1024000,
    "contentType": "application/pdf",
    "metadata": {
      "category": "invoice",
      "department": "finance"
    }
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response
```json
{
  "error": {
    "code": "BadRequest",
    "message": "Container name must contain only lowercase letters, numbers, and hyphens",
    "details": {
      "validationErrors": {
        "container": "Container name must contain only lowercase letters, numbers, and hyphens"
      }
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting and formatting: `npm run lint:fix && npm run format`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.