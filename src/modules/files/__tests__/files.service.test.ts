/**
 * Files Service Tests
 */

import { FilesService } from '../services/files.service';

describe('FilesService', () => {
  let filesService: FilesService;

  beforeEach(() => {
    filesService = new FilesService();
  });

  describe('validateFileName', () => {
    it('should validate valid file names', () => {
      expect(filesService.validateFileName('test.txt')).toBe(true);
      expect(filesService.validateFileName('my-file.pdf')).toBe(true);
      expect(filesService.validateFileName('image_2023.jpg')).toBe(true);
    });

    it('should reject invalid file names', () => {
      expect(filesService.validateFileName('')).toBe(false);
      expect(filesService.validateFileName('file<name>.txt')).toBe(false);
      expect(filesService.validateFileName('CON.txt')).toBe(false);
      expect(filesService.validateFileName('.hidden')).toBe(false);
      expect(filesService.validateFileName('file.')).toBe(false);
    });

    it('should reject file names that are too long', () => {
      const longName = 'a'.repeat(256) + '.txt';
      expect(filesService.validateFileName(longName)).toBe(false);
    });
  });

  describe('validateContainerName', () => {
    it('should validate valid container names', () => {
      expect(filesService.validateContainerName('mycontainer')).toBe(true);
      expect(filesService.validateContainerName('test-container-123')).toBe(true);
      expect(filesService.validateContainerName('abc')).toBe(true);
    });

    it('should reject invalid container names', () => {
      expect(filesService.validateContainerName('ab')).toBe(false); // too short
      expect(filesService.validateContainerName('MyContainer')).toBe(false); // uppercase
      expect(filesService.validateContainerName('container--name')).toBe(false); // double dashes
      expect(filesService.validateContainerName('-container')).toBe(false); // starts with dash
      expect(filesService.validateContainerName('container-')).toBe(false); // ends with dash
    });

    it('should reject container names that are too long', () => {
      const longName = 'a'.repeat(64);
      expect(filesService.validateContainerName(longName)).toBe(false);
    });
  });
});