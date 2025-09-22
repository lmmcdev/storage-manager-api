export enum ErrorCode {
  BadRequest = 'BadRequest',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  TooLarge = 'TooLarge',
  TooManyRequests = 'TooManyRequests',
  Internal = 'Internal',
}

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
    requestId: string;
  };
}

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly requestId: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    requestId: string,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        requestId: this.requestId,
      },
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.BadRequest, message, 400, requestId, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.Unauthorized, message, 401, requestId, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.Forbidden, message, 403, requestId, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.NotFound, message, 404, requestId, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.Conflict, message, 409, requestId, details);
  }
}

export class TooLargeError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.TooLarge, message, 413, requestId, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.TooManyRequests, message, 429, requestId, details);
  }
}

export class InternalError extends ApiError {
  constructor(message: string, requestId: string, details?: ErrorDetails) {
    super(ErrorCode.Internal, message, 500, requestId, details);
  }
}

export function createErrorFromStorageError(error: Error, requestId: string): ApiError {
  const message = error.message.toLowerCase();

  if (message.includes('not found') || message.includes('blobnotfound')) {
    return new NotFoundError('Blob not found', requestId);
  }

  if (message.includes('already exists') || message.includes('blobalreadyexists')) {
    return new ConflictError('Blob already exists', requestId);
  }

  if (message.includes('unauthorized') || message.includes('authentication')) {
    return new UnauthorizedError('Storage authentication failed', requestId);
  }

  if (message.includes('forbidden') || message.includes('authorization')) {
    return new ForbiddenError('Storage operation not authorized', requestId);
  }

  if (message.includes('too large') || message.includes('requestbodytoolarge')) {
    return new TooLargeError('File too large', requestId);
  }

  return new InternalError('Storage operation failed', requestId, {
    originalError: error.message,
  });
}