/**
 * HTTP Utilities Tests
 */

import {
  createSuccessResponse,
  createErrorResponse,
  parseRangeHeader,
  generateDatePath,
} from '../http.util';

describe('HTTP Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with correct format', () => {
      const data = { message: 'test' };
      const requestId = 'req-123';
      const response = createSuccessResponse(data, requestId, 201);

      expect(response.status).toBe(201);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(response.headers).toHaveProperty('X-Request-ID', requestId);
      expect(response.jsonBody).toEqual({
        data,
        requestId,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with correct format', () => {
      const error = 'Bad Request';
      const message = 'Invalid input';
      const requestId = 'req-123';
      const response = createErrorResponse(error, message, requestId, 400);

      expect(response.status).toBe(400);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(response.headers).toHaveProperty('X-Request-ID', requestId);
      expect(response.jsonBody).toEqual({
        error,
        message,
        requestId,
      });
    });
  });

  describe('parseRangeHeader', () => {
    it('should parse valid range headers', () => {
      expect(parseRangeHeader('bytes=0-499', 1000)).toEqual({ start: 0, end: 499 });
      expect(parseRangeHeader('bytes=500-999', 1000)).toEqual({ start: 500, end: 999 });
      expect(parseRangeHeader('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
      expect(parseRangeHeader('bytes=-500', 1000)).toEqual({ start: 0, end: 500 });
    });

    it('should return null for invalid range headers', () => {
      expect(parseRangeHeader('invalid', 1000)).toBeNull();
      expect(parseRangeHeader('bytes=1000-1500', 1000)).toBeNull();
      expect(parseRangeHeader('bytes=500-100', 1000)).toBeNull();
    });
  });

  describe('generateDatePath', () => {
    it('should generate a valid date path', () => {
      const path = generateDatePath();
      const pathRegex = /^\d{4}\/\d{2}\/\d{2}$/;
      expect(pathRegex.test(path)).toBe(true);
    });

    it('should generate current date path', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const expectedPath = `${year}/${month}/${day}`;

      expect(generateDatePath()).toBe(expectedPath);
    });
  });
});