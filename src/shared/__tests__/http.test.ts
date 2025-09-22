import { createSuccessResponse, createErrorResponse, parseRangeHeader, generateRequestId } from '../http';
import { BadRequestError } from '../errors';

describe('HTTP Helpers', () => {
  const mockRequestId = 'test-request-id';

  describe('createSuccessResponse', () => {
    it('should create a success response', () => {
      const data = { test: 'data' };
      const response = createSuccessResponse(data, mockRequestId, 200);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toEqual({
        data,
        requestId: mockRequestId,
      });
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('x-request-id', mockRequestId);
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response from ApiError', () => {
      const error = new BadRequestError('Test error', mockRequestId);
      const response = createErrorResponse(error, mockRequestId);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        error: {
          code: 'BadRequest',
          message: 'Test error',
          requestId: mockRequestId,
        },
      });
    });

    it('should create an error response from generic Error', () => {
      const error = new Error('Generic error');
      const response = createErrorResponse(error, mockRequestId);

      expect(response.status).toBe(500);
      expect(response.jsonBody?.error?.code).toBe('Internal');
    });
  });

  describe('parseRangeHeader', () => {
    it('should parse valid range header', () => {
      const range = parseRangeHeader('bytes=0-999', 2000);
      expect(range).toEqual({ start: 0, end: 999 });
    });

    it('should parse range header with missing end', () => {
      const range = parseRangeHeader('bytes=1000-', 2000);
      expect(range).toEqual({ start: 1000, end: 1999 });
    });

    it('should return null for invalid range', () => {
      const range = parseRangeHeader('bytes=2000-2500', 2000);
      expect(range).toBeNull();
    });

    it('should return null for malformed header', () => {
      const range = parseRangeHeader('invalid-range', 2000);
      expect(range).toBeNull();
    });
  });

  describe('generateRequestId', () => {
    it('should generate a valid UUID', () => {
      const requestId = generateRequestId();
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });
  });
});