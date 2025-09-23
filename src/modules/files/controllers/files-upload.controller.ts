/**
 * Files Upload Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import {
  uploadFormDataSchema,
  uploadJsonSchema,
  UploadJsonRequest,
} from '../../../common/dto/upload.dto';
import {
  createSuccessResponse,
  createErrorResponse,
  getRequestId,
  handleOptionsRequest,
  parseMultipartFormData,
  withErrorHandling,
  generateDatePath,
} from '../../../common/utils/http.util';
import { env } from '../../../common/config/env';

export class FilesUploadController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async uploadForm(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const { fields, files } = await parseMultipartFormData(request);

      if (files.length === 0) {
        return createErrorResponse(
          'Bad Request',
          'No file provided in upload',
          requestId,
          400
        );
      }

      if (files.length > 1) {
        return createErrorResponse(
          'Bad Request',
          'Multiple files not supported',
          requestId,
          400
        );
      }

      const validatedFields = uploadFormDataSchema.parse(fields);
      const file = files[0];

      const container =
        validatedFields.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
      const path = validatedFields.path || generateDatePath();
      const blobName = `${path}/${file.fileName}`;

      const uploadResult = await this.blobStorageService.uploadBlob(
        container,
        blobName,
        file.buffer,
        file.mimeType,
        validatedFields.metadata
      );

      return createSuccessResponse(uploadResult, requestId, 201);
    }, requestId);
  }

  async uploadJson(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const bodyText = await request.text();
      const body = JSON.parse(bodyText);
      const validatedBody = uploadJsonSchema.parse(body) as UploadJsonRequest;

      const container =
        validatedBody.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
      const path = validatedBody.path || generateDatePath();
      const blobName = `${path}/${validatedBody.filename}`;

      const buffer = Buffer.from(validatedBody.contentBase64, 'base64');

      const uploadResult = await this.blobStorageService.uploadBlob(
        container,
        blobName,
        buffer,
        validatedBody.contentType,
        validatedBody.metadata
      );

      return createSuccessResponse(uploadResult, requestId, 201);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesUploadController();

// Unified upload endpoint that handles both form and JSON uploads
app.http('files-upload', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'files/upload',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    const contentType = request.headers.get('content-type') || '';

    // Route to appropriate handler based on content type
    if (contentType.includes('multipart/form-data')) {
      return controller.uploadForm(request, context);
    } else if (contentType.includes('application/json')) {
      return controller.uploadJson(request, context);
    } else {
      return createErrorResponse(
        'Bad Request',
        'Content-Type must be multipart/form-data or application/json',
        requestId,
        400
      );
    }
  },
});

app.http('files-upload-form', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'files/upload/form',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.uploadForm(request, context),
});

app.http('files-upload-json', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'files/upload/json',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.uploadJson(request, context),
});
