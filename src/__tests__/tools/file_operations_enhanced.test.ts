import { jest } from '@jest/globals';
import { UploadFileTool } from '../../tools/files/upload_file.js';
import { DownloadFileTool } from '../../tools/files/download_file.js';
import { QuickbaseClient } from '../../client/quickbase.js';
import { CacheService } from '../../utils/cache.js';
import fs from 'fs';

jest.mock('fs');
jest.mock('../../client/quickbase.js');
jest.mock('../../utils/cache.js');

const mockClient = {
  request: jest.fn(),
} as unknown as jest.Mocked<QuickbaseClient>;

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
} as unknown as jest.Mocked<CacheService>;

const mockFs = fs as jest.Mocked<typeof fs>;

describe('File Operations Enhanced Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UploadFileTool Enhanced', () => {
    let tool: UploadFileTool;

    beforeEach(() => {
      tool = new UploadFileTool(mockClient, mockCache);
    });

    it('should handle large files', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      mockFs.readFileSync.mockReturnValue(largeBuffer);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: largeBuffer.length } as any);

      mockClient.request.mockResolvedValue({
        id: 'file-123',
        fileName: 'large-file.pdf',
        uploaded: true,
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/large-file.pdf',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'file-123',
        fileName: 'large-file.pdf',
        uploaded: true,
      });
    });

    it('should handle files with special characters in names', async () => {
      const buffer = Buffer.from('test content');
      mockFs.readFileSync.mockReturnValue(buffer);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: buffer.length } as any);

      mockClient.request.mockResolvedValue({
        id: 'file-123',
        fileName: 'special chars & symbols (1).pdf',
        uploaded: true,
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/special chars & symbols (1).pdf',
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fileName: 'special chars & symbols (1).pdf',
          }),
        })
      );
    });

    it('should handle empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);
      mockFs.readFileSync.mockReturnValue(emptyBuffer);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 0 } as any);

      mockClient.request.mockResolvedValue({
        id: 'file-123',
        fileName: 'empty.txt',
        uploaded: true,
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/empty.txt',
      });

      expect(result.success).toBe(true);
    });

    it('should handle various content types', async () => {
      const testCases = [
        { file: 'test.jpg', expectedType: 'image/jpeg' },
        { file: 'test.png', expectedType: 'image/png' },
        { file: 'test.gif', expectedType: 'image/gif' },
        { file: 'test.doc', expectedType: 'application/msword' },
        { file: 'test.docx', expectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { file: 'test.xls', expectedType: 'application/vnd.ms-excel' },
        { file: 'test.xlsx', expectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { file: 'test.txt', expectedType: 'text/plain' },
        { file: 'test.csv', expectedType: 'text/csv' },
        { file: 'test.zip', expectedType: 'application/zip' },
        { file: 'test.unknown', expectedType: 'application/octet-stream' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const buffer = Buffer.from('test content');
        mockFs.readFileSync.mockReturnValue(buffer);
        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue({ size: buffer.length } as any);

        mockClient.request.mockResolvedValue({
          id: 'file-123',
          fileName: testCase.file,
          uploaded: true,
        });

        await tool.execute({
          table_id: 'bp8uqvy64',
          record_id: '123',
          field_id: '10',
          file_path: `/path/to/${testCase.file}`,
        });

        expect(mockClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              contentType: testCase.expectedType,
            }),
          })
        );
      }
    });

    it('should handle file read errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/protected.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Permission denied');
    });

    it('should handle custom file names', async () => {
      const buffer = Buffer.from('test content');
      mockFs.readFileSync.mockReturnValue(buffer);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: buffer.length } as any);

      mockClient.request.mockResolvedValue({
        id: 'file-123',
        fileName: 'custom-name.pdf',
        uploaded: true,
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/original.pdf',
        file_name: 'custom-name.pdf',
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            fileName: 'custom-name.pdf',
          }),
        })
      );
    });
  });

  describe('DownloadFileTool Enhanced', () => {
    let tool: DownloadFileTool;

    beforeEach(() => {
      tool = new DownloadFileTool(mockClient, mockCache);
    });

    it('should handle large file downloads', async () => {
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
      mockClient.request.mockResolvedValue(largeBuffer);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/download/large-file.pdf',
      });

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/download/large-file.pdf', largeBuffer);
    });

    it('should handle binary file types', async () => {
      const binaryData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ]);
      
      mockClient.request.mockResolvedValue(binaryData);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/download/image.png',
      });

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/download/image.png', binaryData);
    });

    it('should handle file write permission errors', async () => {
      const buffer = Buffer.from('test content');
      mockClient.request.mockResolvedValue(buffer);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/protected/file.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Permission denied');
    });

    it('should handle specific file versions', async () => {
      const buffer = Buffer.from('version 2 content');
      mockClient.request.mockResolvedValue(buffer);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/download/versioned.pdf',
        version: '2',
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/files/bp8uqvy64/123/10/2',
      });
    });

    it('should handle downloads to different directory structures', async () => {
      const buffer = Buffer.from('test content');
      mockClient.request.mockResolvedValue(buffer);

      const testPaths = [
        '/downloads/subfolder/file.pdf',
        '/tmp/quickbase/exports/data.csv',
        '/Users/test/Documents/important.doc',
        'relative/path/file.txt',
      ];

      for (const path of testPaths) {
        jest.clearAllMocks();
        
        const result = await tool.execute({
          table_id: 'bp8uqvy64',
          record_id: '123',
          field_id: '10',
          output_path: path,
        });

        expect(result.success).toBe(true);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(path, buffer);
      }
    });

    it('should handle empty file downloads', async () => {
      const emptyBuffer = Buffer.alloc(0);
      mockClient.request.mockResolvedValue(emptyBuffer);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/download/empty.txt',
      });

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/download/empty.txt', emptyBuffer);
    });

    it('should handle API errors during download', async () => {
      mockClient.request.mockRejectedValue({
        code: 404,
        message: 'File not found',
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/download/missing.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('File not found');
    });
  });
});