import { validateBody, validateQuery, validateParams, containerNameSchema, blobNameSchema, metadataSchema } from '../validation';
import { BadRequestError } from '../errors';

describe('Validation', () => {
  const mockRequestId = 'test-request-id';

  describe('validateBody', () => {
    it('should validate valid data', () => {
      const schema = containerNameSchema;
      const result = validateBody(schema, 'valid-container', mockRequestId);
      expect(result).toBe('valid-container');
    });

    it('should throw BadRequestError for invalid data', () => {
      const schema = containerNameSchema;
      expect(() => validateBody(schema, 'Invalid-Container', mockRequestId)).toThrow(BadRequestError);
    });
  });

  describe('validateQuery', () => {
    it('should validate valid query parameters', () => {
      const schema = containerNameSchema;
      const query = new URLSearchParams();
      query.set('container', 'valid-container');

      const result = validateQuery(schema, query, mockRequestId);
      expect(result).toBe('valid-container');
    });
  });

  describe('validateParams', () => {
    it('should validate valid path parameters', () => {
      const schema = containerNameSchema;
      const params = { container: 'valid-container' };

      const result = validateParams(schema, params, mockRequestId);
      expect(result).toBe('valid-container');
    });
  });

  describe('containerNameSchema', () => {
    it('should accept valid container names', () => {
      expect(() => containerNameSchema.parse('valid-container')).not.toThrow();
      expect(() => containerNameSchema.parse('test123')).not.toThrow();
      expect(() => containerNameSchema.parse('a-b-c')).not.toThrow();
    });

    it('should reject invalid container names', () => {
      expect(() => containerNameSchema.parse('Invalid-Container')).toThrow();
      expect(() => containerNameSchema.parse('ab')).toThrow();
      expect(() => containerNameSchema.parse('-invalid')).toThrow();
      expect(() => containerNameSchema.parse('invalid-')).toThrow();
    });
  });

  describe('blobNameSchema', () => {
    it('should accept valid blob names', () => {
      expect(() => blobNameSchema.parse('file.txt')).not.toThrow();
      expect(() => blobNameSchema.parse('folder/file.txt')).not.toThrow();
      expect(() => blobNameSchema.parse('2023/01/01/file.pdf')).not.toThrow();
    });

    it('should reject invalid blob names', () => {
      expect(() => blobNameSchema.parse('')).toThrow();
      expect(() => blobNameSchema.parse('/file.txt')).toThrow();
      expect(() => blobNameSchema.parse('file.txt/')).toThrow();
      expect(() => blobNameSchema.parse('folder//file.txt')).toThrow();
    });
  });

  describe('metadataSchema', () => {
    it('should accept valid metadata', () => {
      expect(() => metadataSchema.parse({ key1: 'value1', key2: 'value2' })).not.toThrow();
      expect(() => metadataSchema.parse({ validKey_123: 'value' })).not.toThrow();
    });

    it('should reject invalid metadata', () => {
      expect(() => metadataSchema.parse({ '123invalid': 'value' })).toThrow();
      expect(() => metadataSchema.parse({ 'invalid-key': 'value' })).toThrow();
    });
  });
});