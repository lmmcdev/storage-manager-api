import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { Readable } from 'stream';
import busboy from 'busboy';
import * as path from 'path';

export interface FileUpload {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedFormData {
  fields: Record<string, string>;
  files: FileUpload[];
}

export function getRequestId(request: HttpRequest): string {
  return (
    request.headers.get('x-request-id') ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
}

export function createSuccessResponse(
  data: any,
  requestId: string,
  status = 200
): HttpResponseInit {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-ID': requestId,
    },
    jsonBody: {
      data,
      requestId,
    },
  };
}

export function createErrorResponse(
  error: string,
  message: string,
  requestId: string,
  status = 400
): HttpResponseInit {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-ID': requestId,
    },
    jsonBody: {
      error,
      message,
      requestId,
    },
  };
}

export function handleOptionsRequest(requestId: string): HttpResponseInit {
  return {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Request-ID',
      'X-Request-ID': requestId,
    },
  };
}

export async function parseMultipartFormData(
  request: HttpRequest
): Promise<ParsedFormData> {
  return new Promise(async (resolve, reject) => {
    try {
      const fields: Record<string, string> = {};
      const files: FileUpload[] = [];

      const contentType = request.headers.get('content-type') || '';

      // Get the raw body data from Azure Functions
      const bodyBuffer = await request.arrayBuffer();

      if (!bodyBuffer || bodyBuffer.byteLength === 0) {
        return reject(new Error('No request body provided for multipart form data'));
      }

      const bb = busboy({
        headers: { 'content-type': contentType },
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB
          files: 1,
          fields: 10,
        },
      });

      bb.on('file', (name: string, file: any, info: any) => {
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];

        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          const buffer = Buffer.concat(chunks);
          files.push({
            fileName: filename || 'unnamed',
            mimeType: mimeType || 'application/octet-stream',
            buffer,
          });
        });
      });

      bb.on('field', (name: string, value: string) => {
        fields[name] = value;
      });

      bb.on('finish', () => {
        resolve({ fields, files });
      });

      bb.on('error', (err: Error) => {
        reject(err);
      });

      // Convert ArrayBuffer to Buffer and feed to busboy
      const buffer = Buffer.from(bodyBuffer);
      bb.end(buffer);

    } catch (error) {
      reject(error);
    }
  });
}

export function createStreamResponse(
  stream: Readable,
  requestId: string,
  contentType: string,
  contentLength?: number,
  fileName?: string,
  forceDownload = false
): HttpResponseInit {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'X-Request-ID': requestId,
  };

  if (contentLength !== undefined) {
    headers['Content-Length'] = contentLength.toString();
  }

  if (fileName && forceDownload) {
    headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
  } else if (fileName) {
    headers['Content-Disposition'] = `inline; filename="${fileName}"`;
  }

  return {
    status: 200,
    headers,
    body: stream,
  };
}

export function parseRangeHeader(
  rangeHeader: string,
  fileSize: number
): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }

  return { start, end };
}

export function withErrorHandling(
  handler: () => Promise<HttpResponseInit>,
  requestId: string
): Promise<HttpResponseInit> {
  return handler().catch((error) => {
    console.error('Request failed:', error);

    return createErrorResponse(
      'Internal Server Error',
      error instanceof Error ? error.message : 'Unknown error',
      requestId,
      500
    );
  });
}

export function generateDatePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
