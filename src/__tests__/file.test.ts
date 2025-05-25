import * as fs from 'fs';
import * as path from 'path';
import {
  fileExists,
  ensureDirectoryExists,
  getFileInfo,
  readFileAsBuffer,
  writeFile
} from '../utils/file';

jest.mock('fs');
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('File Utils', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: jest.fn().mockReturnValue(true)
      } as any);

      expect(fileExists('/path/to/file.txt')).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should return false for non-existing file', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(fileExists('/path/to/nonexistent.txt')).toBe(false);
    });

    it('should return false for directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: jest.fn().mockReturnValue(false)
      } as any);

      expect(fileExists('/path/to/directory')).toBe(false);
    });

    it('should handle errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(fileExists('/path/to/file.txt')).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should return true for existing directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: jest.fn().mockReturnValue(true)
      } as any);

      expect(ensureDirectoryExists('/path/to/dir')).toBe(true);
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);

      expect(ensureDirectoryExists('/path/to/new/dir')).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/path/to/new/dir', { recursive: true });
    });

    it('should return false if path exists but is not a directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: jest.fn().mockReturnValue(false)
      } as any);

      expect(ensureDirectoryExists('/path/to/file')).toBe(false);
    });

    it('should handle errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(ensureDirectoryExists('/path/to/dir')).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    it('should return file information', () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-01'),
        isFile: jest.fn().mockReturnValue(true)
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync
        .mockReturnValueOnce(mockStats as any)
        .mockReturnValueOnce(mockStats as any);

      const info = getFileInfo('/path/to/file.txt');
      
      expect(info).toEqual({
        name: 'file.txt',
        size: 1024,
        extension: '.txt',
        mimeType: 'text/plain',
        lastModified: new Date('2024-01-01')
      });
    });

    it('should return null for non-existing file', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(getFileInfo('/path/to/nonexistent.txt')).toBeNull();
    });

    it('should handle files without extension', () => {
      const mockStats = {
        size: 2048,
        mtime: new Date('2024-01-01'),
        isFile: jest.fn().mockReturnValue(true)
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync
        .mockReturnValueOnce({ isFile: jest.fn().mockReturnValue(true) } as any)
        .mockReturnValueOnce(mockStats as any);

      const info = getFileInfo('/path/to/README');
      
      expect(info?.extension).toBe('');
      expect(info?.mimeType).toBe('application/octet-stream');
    });

    it('should return correct mime types', () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-01'),
        isFile: jest.fn().mockReturnValue(true)
      };

      mockFs.existsSync.mockReturnValue(true);

      const testCases = [
        { file: 'test.json', mime: 'application/json' },
        { file: 'test.pdf', mime: 'application/pdf' },
        { file: 'test.png', mime: 'image/png' },
        { file: 'test.jpg', mime: 'image/jpeg' },
        { file: 'test.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];

      testCases.forEach(({ file, mime }) => {
        mockFs.statSync
          .mockReturnValueOnce({ isFile: jest.fn().mockReturnValue(true) } as any)
          .mockReturnValueOnce(mockStats as any);

        const info = getFileInfo(`/path/to/${file}`);
        expect(info?.mimeType).toBe(mime);
      });
    });

    it('should handle errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync
        .mockReturnValueOnce({ isFile: jest.fn().mockReturnValue(true) } as any)
        .mockImplementationOnce(() => {
          throw new Error('Permission denied');
        });

      expect(getFileInfo('/path/to/file.txt')).toBeNull();
    });
  });

  describe('readFileAsBuffer', () => {
    it('should read file as buffer', () => {
      const mockBuffer = Buffer.from('file content');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: jest.fn().mockReturnValue(true) } as any);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const result = readFileAsBuffer('/path/to/file.txt');
      
      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should return null for non-existing file', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(readFileAsBuffer('/path/to/nonexistent.txt')).toBeNull();
    });

    it('should handle read errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isFile: jest.fn().mockReturnValue(true) } as any);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(readFileAsBuffer('/path/to/file.txt')).toBeNull();
    });
  });

  describe('writeFile', () => {
    it('should write string data to file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) } as any);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = writeFile('/path/to/output.txt', 'file content');
      
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/path/to/output.txt', 'file content');
    });

    it('should write buffer data to file', () => {
      const buffer = Buffer.from('binary data');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) } as any);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = writeFile('/path/to/output.bin', buffer);
      
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/path/to/output.bin', buffer);
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = writeFile('/new/path/to/file.txt', 'content');
      
      expect(result).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/new/path/to', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/new/path/to/file.txt', 'content');
    });

    it('should return false if directory creation fails', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(writeFile('/path/to/file.txt', 'content')).toBe(false);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle write errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) } as any);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      expect(writeFile('/path/to/output.txt', 'content')).toBe(false);
    });
  });
});