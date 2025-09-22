import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Readable } from 'stream';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateBody, validateQuery } from '../shared/validation';
import { uploadFormDataSchema, uploadJsonSchema, UploadJsonRequest } from '../schemas/upload.dto';
import {
  createSuccessResponse,
  createErrorResponse,
  getRequestId,
  handleOptionsRequest,
  parseMultipartFormData,
  withErrorHandling,
} from '../shared/http';
import { BadRequestError } from '../shared/errors';
import { env } from '../shared/env';

async function filesUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'upload' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);
    requireRole(authContext, 'files.write', requestId);

    const contentType = request.headers.get('content-type') || '';
    const blobStorageService = new BlobStorageService(logger);

    let uploadResult;

    if (contentType.includes('multipart/form-data')) {
      uploadResult = await handleMultipartUpload(request, blobStorageService, requestId, logger);
    } else if (contentType.includes('application/json')) {
      uploadResult = await handleJsonUpload(request, blobStorageService, requestId, logger);
    } else {
      throw new BadRequestError(
        'Content-Type must be multipart/form-data or application/json',
        requestId
      );
    }

    logger.info('File upload completed successfully', {
      blobName: uploadResult.blobName,
      container: uploadResult.container,
      size: uploadResult.size,
    });

    return createSuccessResponse(uploadResult, requestId, 201);
  }, requestId, logger);
}

async function handleMultipartUpload(
  request: HttpRequest,
  blobStorageService: BlobStorageService,
  requestId: string,
  logger: any
) {
  const { fields, files } = await parseMultipartFormData(request);

  if (files.length === 0) {
    throw new BadRequestError('No file provided in upload', requestId);
  }

  if (files.length > 1) {
    throw new BadRequestError('Multiple files not supported', requestId);
  }

  const formData = validateBody(uploadFormDataSchema, fields, requestId);
  const file = files[0];

  const container = formData.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
  const path = formData.path || generateDatePath();
  const blobName = `${path}/${file.fileName}`;

  logger.debug('Processing multipart upload', {
    fileName: file.fileName,
    fileSize: file.buffer.length,
    contentType: file.mimeType,
    container,
    blobName,
  });

  return blobStorageService.uploadBlob(
    container,
    blobName,
    file.buffer,
    file.mimeType,
    formData.metadata,
    requestId
  );
}

async function handleJsonUpload(
  request: HttpRequest,
  blobStorageService: BlobStorageService,
  requestId: string,
  logger: any
) {
  const body = validateBody(uploadJsonSchema, request.body, requestId) as UploadJsonRequest;

  const container = body.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
  const path = body.path || generateDatePath();
  const blobName = `${path}/${body.filename}`;

  const buffer = Buffer.from(body.contentBase64, 'base64');

  logger.debug('Processing JSON upload', {
    fileName: body.filename,
    fileSize: buffer.length,
    contentType: body.contentType,
    container,
    blobName,
  });

  return blobStorageService.uploadBlob(
    container,
    blobName,
    buffer,
    body.contentType,
    body.metadata,
    requestId
  );
}

function generateDatePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

app.http('files-upload', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/upload',
  handler: filesUpload,
});