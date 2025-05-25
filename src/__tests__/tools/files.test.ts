import { UploadFileTool } from '../../tools/files/upload_file';
import { DownloadFileTool } from '../../tools/files/download_file';
import { QuickbaseClient } from '../../client/quickbase';
import { ApiResponse } from '../../types/api';
import * as fileUtils from '../../utils/file';
import * as fs from 'fs';

jest.mock('../../utils/file');
jest.mock('fs');
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('File Tools', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;
  const mockFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
    jest.clearAllMocks();
  });

  describe('UploadFileTool', () => {
    let tool: UploadFileTool;

    beforeEach(() => {
      tool = new UploadFileTool(mockClient);
    });

    it('should upload a file successfully', async () => {
      const mockFileInfo = {
        name: 'test.pdf',
        size: 1024,
        extension: '.pdf',
        mimeType: 'application/pdf',
        lastModified: new Date('2024-01-01')
      };
      const mockBuffer = Buffer.from('file content');

      mockFileUtils.fileExists.mockReturnValue(true);
      mockFileUtils.getFileInfo.mockReturnValue(mockFileInfo);
      mockFileUtils.readFileAsBuffer.mockReturnValue(mockBuffer);

      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fileName: 'test.pdf',
          versions: [
            {
              versionNumber: 1,
              uploaded: '2024-01-01T00:00:00Z'
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/test.pdf'
      });

      expect(mockFileUtils.fileExists).toHaveBeenCalledWith('/path/to/test.pdf');
      expect(mockFileUtils.getFileInfo).toHaveBeenCalledWith('/path/to/test.pdf');
      expect(mockFileUtils.readFileAsBuffer).toHaveBeenCalledWith('/path/to/test.pdf');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/files',
        body: {
          tableId: 'bp8uqvy64',
          recordId: '123',
          fieldId: '10',
          fileName: 'test.pdf',
          contentType: 'application/pdf',
          fileData: mockBuffer.toString('base64')
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should use custom filename if provided', async () => {
      const mockFileInfo = {
        name: 'original.txt',
        size: 2048,
        extension: '.txt',
        mimeType: 'text/plain',
        lastModified: new Date('2024-01-01')
      };
      const mockBuffer = Buffer.from('file content');

      mockFileUtils.fileExists.mockReturnValue(true);
      mockFileUtils.getFileInfo.mockReturnValue(mockFileInfo);
      mockFileUtils.readFileAsBuffer.mockReturnValue(mockBuffer);

      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fileName: 'custom.txt'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/original.txt',
        file_name: 'custom.txt'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/files',
        body: {
          tableId: 'bp8uqvy64',
          recordId: '123',
          fieldId: '10',
          fileName: 'custom.txt',
          contentType: 'text/plain',
          fileData: mockBuffer.toString('base64')
        }
      });
    });

    it('should handle file not found error', async () => {
      mockFileUtils.fileExists.mockReturnValue(false);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/nonexistent.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('File not found: /path/to/nonexistent.pdf');
    });

    it('should handle null file info', async () => {
      mockFileUtils.fileExists.mockReturnValue(true);
      mockFileUtils.getFileInfo.mockReturnValue(null);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/test.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unable to get file information: /path/to/test.pdf');
    });

    it('should handle null file buffer', async () => {
      const mockFileInfo = {
        name: 'test.pdf',
        size: 1024,
        extension: '.pdf',
        mimeType: 'application/pdf',
        lastModified: new Date('2024-01-01')
      };

      mockFileUtils.fileExists.mockReturnValue(true);
      mockFileUtils.getFileInfo.mockReturnValue(mockFileInfo);
      mockFileUtils.readFileAsBuffer.mockReturnValue(null);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/test.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unable to read file: /path/to/test.pdf');
    });

    it('should handle upload failure', async () => {
      const mockFileInfo = {
        name: 'test.pdf',
        size: 1024,
        extension: '.pdf',
        mimeType: 'application/pdf',
        lastModified: new Date()
      };
      const mockBuffer = Buffer.from('file content');

      mockFileUtils.fileExists.mockReturnValue(true);
      mockFileUtils.getFileInfo.mockReturnValue(mockFileInfo);
      mockFileUtils.readFileAsBuffer.mockReturnValue(mockBuffer);

      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 400,
          message: 'Field 10 is not a file attachment field'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '/path/to/test.pdf'
      });

      expect(result).toEqual(mockError);
    });
  });

  describe('DownloadFileTool', () => {
    let tool: DownloadFileTool;

    beforeEach(() => {
      tool = new DownloadFileTool(mockClient);
    });

    it('should download a file successfully', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: 'base64filecontent',
          fileName: 'downloaded.pdf',
          contentType: 'application/pdf'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);
      mockFileUtils.writeFile.mockReturnValue(true);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/path/to/output.pdf'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/files/bp8uqvy64/123/10/1'
      });

      const expectedBuffer = Buffer.from('base64filecontent', 'base64');
      expect(mockFileUtils.writeFile).toHaveBeenCalledWith('/path/to/output.pdf', expectedBuffer);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        outputPath: '/path/to/output.pdf',
        fileName: 'downloaded.pdf',
        contentType: 'application/pdf',
        size: expectedBuffer.length
      });
    });

    it('should download specific version', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: 'base64content',
          fileName: 'file_v2.pdf',
          contentType: 'application/pdf'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);
      mockFileUtils.writeFile.mockReturnValue(true);

      await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/path/to/output.pdf',
        version: '2'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/files/bp8uqvy64/123/10/2'
      });
    });

    it('should handle file not found error', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'No file attachment found in field'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/path/to/output.pdf'
      });

      expect(result).toEqual(mockError);
      expect(mockFileUtils.writeFile).not.toHaveBeenCalled();
    });

    it('should handle write error', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: 'base64content',
          fileName: 'file.pdf',
          contentType: 'application/pdf'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);
      mockFileUtils.writeFile.mockReturnValue(false);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/path/to/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unable to create output directory: /path/to');
    });

    it('should handle missing data in response', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fileName: 'file.pdf',
          contentType: 'application/pdf'
          // missing 'data' field
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '/path/to/output.pdf'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid file path: directory traversal detected');
    });
  });
});