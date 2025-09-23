import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { ApiError, InternalError } from '../exceptions/errors';
import { Logger, logError } from './logger';
import { getCorsOrigins } from '../config/env';

export interface SuccessResponse<T = unknown> {
  data: T;
  requestId: string;
}

export function generateRequestId(): string {
  return uuidv4();
}

export function getRequestId(request: HttpRequest): string {
  return request.headers.get('x-request-id') || generateRequestId();
}

export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  statusCode = 200
): HttpResponseInit {
  const response: SuccessResponse<T> = {
    data,
    requestId,
  };

  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...getCorsHeaders(),
    },
    jsonBody: response,
  };
}

export function createErrorResponse(
  error: ApiError | Error,
  requestId: string
): HttpResponseInit {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else {
    apiError = new InternalError('An unexpected error occurred', requestId);
    logError(requestId, error);
  }

  return {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...getCorsHeaders(),
    },
    jsonBody: apiError.toJSON(),
  };
}

export function createStreamResponse(
  stream: NodeJS.ReadableStream,
  requestId: string,
  contentType: string,
  contentLength?: number,
  fileName?: string,
  forceDownload = false
): HttpResponseInit {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'x-request-id': requestId,
    ...getCorsHeaders(),
  };

  if (contentLength !== undefined) {
    headers['Content-Length'] = contentLength.toString();
  }

  if (fileName) {
    const disposition = forceDownload ? 'attachment' : 'inline';
    headers['Content-Disposition'] = `${disposition}; filename="${fileName}"`;
  }

  return {
    status: 200,
    headers,
    body: stream as any,
  };
}

export function getCorsHeaders(): Record<string, string> {
  const origins = getCorsOrigins();
  const allowOrigin = origins.includes('*') ? '*' : origins.join(', ');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-api-key, x-request-id',
    'Access-Control-Expose-Headers': 'x-request-id',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleOptionsRequest(requestId: string): HttpResponseInit {
  return {
    status: 204,
    headers: {
      'x-request-id': requestId,
      ...getCorsHeaders(),
    },
  };
}

export async function parseMultipartFormData(request: HttpRequest): Promise<{
  fields: Record<string, string>;
  files: Array<{
    fieldName: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }>;
}> {
  return new Promise(async (resolve, reject) => {
    const Busboy = require('busboy');
    const fields: Record<string, string> = {};
    const files: Array<{
      fieldName: string;
      fileName: string;
      mimeType: string;
      buffer: Buffer;
    }> = [];

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      reject(new Error('Content-Type must be multipart/form-data'));
      return;
    }

    const busboy = Busboy({ headers: { 'content-type': contentType } });

    busboy.on('field', (fieldname: string, val: string) => {
      fields[fieldname] = val;
    });

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; mimeType: string }
      ) => {
        const chunks: Buffer[] = [];

        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          files.push({
            fieldName: fieldname,
            fileName: info.filename,
            mimeType: info.mimeType,
            buffer: Buffer.concat(chunks),
          });
        });
      }
    );

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', (error: Error) => {
      reject(error);
    });

    // Handle Azure Functions v4 ReadableStream body
    if (request.body) {
      if (typeof request.body === 'string') {
        busboy.write(request.body);
        busboy.end();
      } else if (Buffer.isBuffer(request.body)) {
        busboy.write(request.body);
        busboy.end();
      } else if (
        request.body &&
        typeof request.body === 'object' &&
        'pipe' in request.body
      ) {
        // Handle Node.js stream
        (request.body as any).pipe(busboy);
      } else {
        // Handle Web Streams API (ReadableStream)
        try {
          const bodyBuffer = await request.arrayBuffer();
          busboy.write(Buffer.from(bodyBuffer));
          busboy.end();
        } catch (error) {
          reject(new Error('Failed to read request body: ' + error));
        }
      }
    } else {
      busboy.end();
    }
  });
}

export function parseRangeHeader(
  rangeHeader: string,
  contentLength: number
): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : contentLength - 1;

  if (start >= contentLength || end >= contentLength || start > end) {
    return null;
  }

  return { start, end };
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  requestId: string,
  logger: Logger
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn(`API error: ${error.message}`, {
        code: error.code,
        statusCode: error.statusCode,
      });
      throw error;
    }

    logger.error('Unexpected error during operation', error);
    throw new InternalError('An unexpected error occurred', requestId);
  }
}
