# Storage Manager API - Postman Collection

This directory contains a comprehensive Postman collection for testing the Storage Manager API.

## Files Included

1. **`Storage_Manager_API.postman_collection.json`** - Main collection with all API endpoints
2. **`Storage_Manager_API.postman_environment.json`** - Development environment variables
3. **`Storage_Manager_API_Production.postman_environment.json`** - Production environment template

## Quick Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Storage_Manager_API.postman_collection.json`
4. Click **Import**

### 2. Import Environment
1. Click **Import** button again
2. Select `Storage_Manager_API.postman_environment.json`
3. Click **Import**
4. Select the "Storage Manager API - Development" environment from the dropdown

### 3. Configure Environment Variables

Before testing, update these environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:7071/api` |
| `apiKey` | Authentication API key | `dev-key-1` |
| `containerName` | Azure Blob Storage container | `uploads` |
| `prefix` | Optional file prefix filter | `` (empty) |

## API Endpoints Included

### Health Check
- **GET** `/health` - Check API and storage service health

### File Operations
- **GET** `/files/list` - List files in container
- **POST** `/files/upload` - Upload file (form-data or JSON)
- **GET** `/files/{container}/{blobPath}` - Download file
- **PUT** `/files/copy` - Copy or move files
- **DELETE** `/files/{container}/{blobPath}` - Delete file

### SAS (Shared Access Signature)
- **POST** `/files/sas` - Generate time-limited access URLs

## Testing Features

### Automated Tests
Each request includes automated tests that verify:
- ✅ Response status codes
- ✅ Response structure
- ✅ Required fields presence
- ✅ Data types and values

### Dynamic Variables
- `{{$guid}}` - Generates unique request IDs
- `{{$randomFileName}}` - Creates random file names
- `{{$isoTimestamp}}` - Current timestamp

### Request Chaining
- Upload responses automatically populate `uploadedBlobPath`
- SAS generation responses populate `sasUrl` for testing
- Variables are shared between related requests

## Usage Workflow

### 1. Basic Health Check
Start with the health check to verify API connectivity:
```
GET /health
```

### 2. File Upload and Management
1. **Upload a file** using either:
   - Form-data method (select actual file)
   - JSON method (base64 encoded content)

2. **List files** to see uploaded content:
   ```
   GET /files/list?container=uploads
   ```

3. **Download the file** using the stored blob path:
   ```
   GET /files/{container}/{uploadedBlobPath}
   ```

4. **Copy the file** to another location:
   ```
   PUT /files/copy
   ```

5. **Delete the copy**:
   ```
   DELETE /files/{container}/copies/{uploadedBlobPath}
   ```

### 3. SAS URL Generation
1. **Generate SAS URL** for secure file access:
   ```
   POST /files/sas
   ```

2. **Test SAS URL** by accessing the generated URL directly

## Advanced Features

### Range Requests
Test partial content downloads using the Range header:
```
Range: bytes=0-100
```

### Metadata Support
Add custom metadata to uploads:
```json
{
  "metadata": {
    "author": "your-name",
    "department": "engineering",
    "project": "storage-api"
  }
}
```

### Permissions
SAS URLs support various permission combinations:
- `r` - Read only
- `w` - Write only
- `rw` - Read and write
- `d` - Delete
- `rd` - Read and delete
- `wd` - Write and delete
- `rwd` - Read, write, and delete

## Environment Configuration

### Development Environment
- Uses `http://localhost:7071/api`
- API key: `dev-key-1`
- Container: `uploads`

### Production Environment
1. Import `Storage_Manager_API_Production.postman_environment.json`
2. Update these values:
   - `baseUrl`: Your Azure Function App URL
   - `apiKey`: Your production API key
3. Switch to production environment before testing

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify `apiKey` environment variable
   - Check API key configuration in `.env` file

2. **404 Not Found**
   - Verify `baseUrl` is correct
   - Ensure Azure Functions are running locally (`npm start`)

3. **500 Internal Server Error**
   - Check Azure Storage configuration
   - Verify connection string in `.env` file
   - Review function logs for detailed errors

### Authentication
All endpoints except `/health` require API key authentication via the `x-api-key` header.

### Request IDs
Each request includes a unique `x-request-id` header for tracing and debugging.

## Testing Scenarios

The collection includes comprehensive test scenarios:
- ✅ Successful operations
- ✅ Authentication validation
- ✅ Parameter validation
- ✅ Error handling
- ✅ File operations workflow
- ✅ SAS URL generation and usage

Run the entire collection using Postman's Collection Runner for automated testing.