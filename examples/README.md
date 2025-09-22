# API Examples

This directory contains example requests and collections for testing the Storage Manager API.

## Files

- **`postman-collection.json`** - Complete Postman collection with all API endpoints
- **`curl-examples.sh`** - Bash script with cURL examples for all operations
- **`README.md`** - This file

## Postman Collection

### Import Instructions

1. Open Postman
2. Click "Import" button
3. Select `postman-collection.json`
4. The collection will be imported with environment variables

### Environment Variables

The collection includes these variables that you can customize:

- `baseUrl` - API base URL (default: `http://localhost:7071/api/v1`)
- `apiKey` - Your API key (default: `dev-key-1`)
- `container` - Default container name (default: `uploads`)

### Available Requests

1. **Upload File (Multipart)** - Upload using form data
2. **Upload File (JSON Base64)** - Upload using base64 encoded content
3. **Download File** - Regular file download
4. **Download File (Force Download)** - Force download with Content-Disposition
5. **Download File (Range Request)** - Partial download using Range header
6. **List Files** - List all files in container
7. **List Files with Prefix** - List files with path prefix filter
8. **Generate SAS URL (Read)** - Create read-only SAS token
9. **Generate SAS URL (Read/Write)** - Create read/write SAS token
10. **Copy File** - Copy file to new location
11. **Move File** - Move file to new location
12. **Delete File** - Delete a file

## cURL Examples

### Run All Examples

```bash
# Make sure the API is running locally
npm start

# In another terminal, run the examples
cd examples
./curl-examples.sh
```

### Prerequisites for cURL Examples

- `jq` for JSON formatting (optional but recommended)
- `curl` command-line tool
- API running on `http://localhost:7071`

### Individual Examples

#### Upload File (Multipart)
```bash
curl -X POST \
  -H "x-api-key: dev-key-1" \
  -F "file=@sample.txt" \
  -F "container=uploads" \
  -F "path=examples" \
  -F "metadata={\"source\":\"manual\"}" \
  http://localhost:7071/api/v1/files/upload
```

#### Upload File (JSON)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "contentBase64": "SGVsbG8gV29ybGQ=",
    "filename": "hello.txt",
    "contentType": "text/plain",
    "container": "uploads"
  }' \
  http://localhost:7071/api/v1/files/upload
```

#### List Files
```bash
curl -H "x-api-key: dev-key-1" \
  "http://localhost:7071/api/v1/files/list?container=uploads&max=10"
```

#### Download File
```bash
curl -H "x-api-key: dev-key-1" \
  http://localhost:7071/api/v1/files/uploads/examples/sample.txt
```

#### Generate SAS URL
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "container": "uploads",
    "blobName": "examples/sample.txt",
    "permissions": "r",
    "expiresInSeconds": 3600
  }' \
  http://localhost:7071/api/v1/files/sas
```

#### Copy File
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "source": {
      "container": "uploads",
      "blobName": "examples/sample.txt"
    },
    "target": {
      "container": "uploads",
      "blobName": "examples/copies/sample-copy.txt"
    },
    "move": false
  }' \
  http://localhost:7071/api/v1/files/copy
```

#### Delete File
```bash
curl -X DELETE \
  -H "x-api-key: dev-key-1" \
  http://localhost:7071/api/v1/files/uploads/examples/sample.txt
```

## Testing Different Scenarios

### Error Scenarios

#### Invalid API Key
```bash
curl -H "x-api-key: invalid-key" \
  http://localhost:7071/api/v1/files/list
# Expected: 401 Unauthorized
```

#### Invalid Container Name
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "contentBase64": "SGVsbG8=",
    "filename": "test.txt",
    "contentType": "text/plain",
    "container": "Invalid-Container"
  }' \
  http://localhost:7071/api/v1/files/upload
# Expected: 400 Bad Request (validation error)
```

#### File Not Found
```bash
curl -H "x-api-key: dev-key-1" \
  http://localhost:7071/api/v1/files/uploads/nonexistent/file.txt
# Expected: 404 Not Found
```

### Large File Upload

For testing large files, you can create a test file:

```bash
# Create a 10MB test file
dd if=/dev/zero of=large-file.bin bs=1M count=10

# Upload it
curl -X POST \
  -H "x-api-key: dev-key-1" \
  -F "file=@large-file.bin" \
  -F "container=uploads" \
  -F "path=large-files" \
  http://localhost:7071/api/v1/files/upload
```

### Range Requests

Test partial downloads:

```bash
# Download first 100 bytes
curl -H "x-api-key: dev-key-1" \
  -H "Range: bytes=0-99" \
  http://localhost:7071/api/v1/files/uploads/large-files/large-file.bin
```

## Azure AD Authentication Examples

If using Azure AD authentication mode:

```bash
# Get access token (example with Azure CLI)
TOKEN=$(az account get-access-token --query accessToken -o tsv)

# Use Bearer token instead of API key
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7071/api/v1/files/list
```

## Production Environment

For production testing, update the base URL:

```bash
BASE_URL="https://your-function-app.azurewebsites.net/api/v1"
```

And use production API keys or Azure AD tokens.

## Troubleshooting

### Common Issues

1. **API not responding**: Make sure `npm start` is running
2. **Authentication errors**: Check API key configuration
3. **File not found**: Verify the file was uploaded successfully
4. **CORS errors**: Check CORS configuration in browser testing

### Debug Mode

Enable debug logging to see detailed request/response information:

```json
{
  "LOG_LEVEL": "debug"
}
```

### Verbose cURL

Add `-v` flag to cURL commands for detailed HTTP information:

```bash
curl -v -H "x-api-key: dev-key-1" \
  http://localhost:7071/api/v1/files/list
```