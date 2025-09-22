#!/bin/bash

# Storage Manager API - cURL Examples
# Configure these variables for your environment
BASE_URL="http://localhost:7071/api/v1"
API_KEY="dev-key-1"
CONTAINER="uploads"

echo "=== Storage Manager API Examples ==="
echo "Base URL: $BASE_URL"
echo "Container: $CONTAINER"
echo ""

# 1. Upload File (Multipart)
echo "1. Upload File (Multipart)"
echo "Creating a sample file..."
echo "Hello World from cURL example!" > sample.txt

curl -X POST \
  -H "x-api-key: $API_KEY" \
  -F "file=@sample.txt" \
  -F "container=$CONTAINER" \
  -F "path=examples/curl" \
  -F "metadata={\"source\":\"curl\",\"type\":\"example\"}" \
  "$BASE_URL/files/upload" | jq '.'

echo -e "\n"

# 2. Upload File (JSON Base64)
echo "2. Upload File (JSON Base64)"
CONTENT_BASE64=$(echo "Hello World from JSON upload!" | base64)

curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"contentBase64\": \"$CONTENT_BASE64\",
    \"filename\": \"hello-json.txt\",
    \"contentType\": \"text/plain\",
    \"container\": \"$CONTAINER\",
    \"path\": \"examples/json\",
    \"metadata\": {
      \"source\": \"curl\",
      \"encoding\": \"base64\"
    }
  }" \
  "$BASE_URL/files/upload" | jq '.'

echo -e "\n"

# 3. List Files
echo "3. List Files"
curl -H "x-api-key: $API_KEY" \
  "$BASE_URL/files/list?container=$CONTAINER&max=10" | jq '.'

echo -e "\n"

# 4. List Files with Prefix
echo "4. List Files with Prefix (examples/)"
curl -H "x-api-key: $API_KEY" \
  "$BASE_URL/files/list?container=$CONTAINER&prefix=examples/&max=20" | jq '.'

echo -e "\n"

# 5. Download File
echo "5. Download File (sample.txt)"
curl -H "x-api-key: $API_KEY" \
  "$BASE_URL/files/$CONTAINER/examples/curl/sample.txt" \
  -o downloaded-sample.txt

if [ -f "downloaded-sample.txt" ]; then
  echo "File downloaded successfully:"
  cat downloaded-sample.txt
  echo ""
else
  echo "Download failed"
fi

echo -e "\n"

# 6. Download File with Range Request
echo "6. Download File (Range Request - first 10 bytes)"
curl -H "x-api-key: $API_KEY" \
  -H "Range: bytes=0-9" \
  "$BASE_URL/files/$CONTAINER/examples/curl/sample.txt"

echo -e "\n\n"

# 7. Generate SAS URL
echo "7. Generate SAS URL (Read permissions)"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"container\": \"$CONTAINER\",
    \"blobName\": \"examples/curl/sample.txt\",
    \"permissions\": \"r\",
    \"expiresInSeconds\": 3600
  }" \
  "$BASE_URL/files/sas" | jq '.'

echo -e "\n"

# 8. Copy File
echo "8. Copy File"
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"source\": {
      \"container\": \"$CONTAINER\",
      \"blobName\": \"examples/curl/sample.txt\"
    },
    \"target\": {
      \"container\": \"$CONTAINER\",
      \"blobName\": \"examples/copies/sample-copy.txt\"
    },
    \"move\": false,
    \"metadata\": {
      \"operation\": \"copy\",
      \"source\": \"curl\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }" \
  "$BASE_URL/files/copy" | jq '.'

echo -e "\n"

# 9. Move File (create a temp file first)
echo "9. Move File (create temp file first)"
echo "Temporary file content" > temp-file.txt

# Upload temp file
curl -X POST \
  -H "x-api-key: $API_KEY" \
  -F "file=@temp-file.txt" \
  -F "container=$CONTAINER" \
  -F "path=examples/temp" \
  "$BASE_URL/files/upload" > /dev/null

# Move the temp file
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"source\": {
      \"container\": \"$CONTAINER\",
      \"blobName\": \"examples/temp/temp-file.txt\"
    },
    \"target\": {
      \"container\": \"$CONTAINER\",
      \"blobName\": \"examples/moved/moved-file.txt\"
    },
    \"move\": true,
    \"metadata\": {
      \"operation\": \"move\",
      \"movedBy\": \"curl\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }" \
  "$BASE_URL/files/copy" | jq '.'

echo -e "\n"

# 10. Delete File
echo "10. Delete File"
curl -X DELETE \
  -H "x-api-key: $API_KEY" \
  "$BASE_URL/files/$CONTAINER/examples/moved/moved-file.txt" | jq '.'

echo -e "\n"

# Cleanup
echo "Cleaning up local files..."
rm -f sample.txt temp-file.txt downloaded-sample.txt

echo "=== Examples completed ==="