import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';
import { fileExists, getFileInfo, readFileAsBuffer } from '../../utils/file';

const logger = createLogger('UploadFileTool');

/**
 * Parameters for upload_file tool
 */
export interface UploadFileParams {
  /**
   * The ID of the table containing the record
   */
  table_id: string;
  
  /**
   * The ID of the record to attach the file to
   */
  record_id: string;
  
  /**
   * The ID of the file attachment field
   */
  field_id: string;
  
  /**
   * Path to the file to upload
   */
  file_path: string;
  
  /**
   * Custom file name (optional, defaults to the original filename)
   */
  file_name?: string;
}

/**
 * Response from uploading a file
 */
export interface UploadFileResult {
  /**
   * The ID of the record the file was attached to
   */
  recordId: string;
  
  /**
   * The ID of the field the file was attached to
   */
  fieldId: string;
  
  /**
   * The ID of the table containing the record
   */
  tableId: string;
  
  /**
   * The name of the uploaded file
   */
  fileName: string;
  
  /**
   * The size of the uploaded file in bytes
   */
  fileSize: number;
  
  /**
   * The version of the file (incremented for each upload to the same field)
   */
  version?: number;
  
  /**
   * Upload timestamp
   */
  uploadTime?: string;
}

/**
 * Tool for uploading a file to a field in a Quickbase record
 */
export class UploadFileTool extends BaseTool<UploadFileParams, UploadFileResult> {
  public name = 'upload_file';
  public description = 'Uploads a file to a field in a Quickbase record';
  
  /**
   * Parameter schema for upload_file
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table (must be a file attachment field)'
      },
      record_id: {
        type: 'string',
        description: 'The ID of the record'
      },
      field_id: {
        type: 'string',
        description: 'The ID of the field (must be a file attachment field)'
      },
      file_path: {
        type: 'string',
        description: 'Path to the file to upload'
      },
      file_name: {
        type: 'string',
        description: 'Custom file name (optional, defaults to the original filename)'
      }
    },
    required: ['table_id', 'record_id', 'field_id', 'file_path']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the upload_file tool
   * @param params Tool parameters
   * @returns Upload result
   */
  protected async run(params: UploadFileParams): Promise<UploadFileResult> {
    const { table_id, record_id, field_id, file_path, file_name } = params;
    
    logger.info('Uploading file to Quickbase record', { 
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      filePath: file_path
    });
    
    // Check if the file exists
    if (!fileExists(file_path)) {
      throw new Error(`File not found: ${file_path}`);
    }
    
    // Get file information
    const fileInfo = getFileInfo(file_path);
    if (!fileInfo) {
      throw new Error(`Unable to get file information: ${file_path}`);
    }

    // Validate file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (fileInfo.size > MAX_FILE_SIZE) {
      throw new Error(`File size ${fileInfo.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    // Secure file path validation - prevent directory traversal attacks
    const path = await import('path');
    const fs = await import('fs');
    
    // First, validate the input path before any resolution
    if (!file_path || typeof file_path !== 'string') {
      throw new Error('Invalid file path: must be a non-empty string');
    }
    
    // Reject obvious traversal attempts immediately
    if (file_path.includes('..') || file_path.startsWith('/') || file_path.includes('\\')) {
      throw new Error('Invalid file path: directory traversal detected');
    }
    
    // Define allowed working directory (current directory only)
    const workingDir = process.cwd();
    let resolvedPath: string;
    
    try {
      // Resolve the path relative to working directory
      resolvedPath = path.resolve(workingDir, file_path);
    } catch (error) {
      throw new Error('Invalid file path format');
    }
    
    // Critical security check: ensure resolved path is within working directory
    if (!resolvedPath.startsWith(workingDir + path.sep) && resolvedPath !== workingDir) {
      throw new Error('Invalid file path: access outside working directory denied');
    }
    
    // Verify file exists and is readable
    try {
      await fs.promises.access(resolvedPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`File access denied or file does not exist: ${file_path}`);
    }
    
    // Memory-efficient file reading with size validation
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    let fileBase64: string;
    
    try {
      if (fileInfo.size > 10 * 1024 * 1024) { // > 10MB, use streaming
        logger.debug('Using streaming read for large file', { size: fileInfo.size });
        
        // Stream the file in chunks to prevent memory overflow
        const chunks: string[] = [];
        const readStream = fs.createReadStream(resolvedPath, { highWaterMark: CHUNK_SIZE });
        
        for await (const chunk of readStream) {
          chunks.push((chunk as Buffer).toString('base64'));
        }
        
        fileBase64 = chunks.join('');
      } else {
        // Small files can be read directly
        const fileBuffer = readFileAsBuffer(file_path);
        if (!fileBuffer) {
          throw new Error(`Unable to read file: ${file_path}`);
        }
        fileBase64 = fileBuffer.toString('base64');
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Prepare the file upload request
    const body = {
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      fileName: file_name || fileInfo.name,
      contentType: fileInfo.mimeType,
      fileData: fileBase64
    };
    
    // Upload the file
    const response = await this.client.request({
      method: 'POST',
      path: '/files',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to upload file', { 
        error: response.error,
        tableId: table_id,
        recordId: record_id,
        fieldId: field_id
      });
      throw new Error(response.error?.message || 'Failed to upload file');
    }
    
    const fileData = response.data as Record<string, any>;
    
    logger.info('Successfully uploaded file', { 
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      fileName: file_name || fileInfo.name
    });
    
    return {
      recordId: record_id,
      fieldId: field_id,
      tableId: table_id,
      fileName: file_name || fileInfo.name,
      fileSize: fileInfo.size,
      version: fileData.version || 1,
      uploadTime: new Date().toISOString()
    };
  }
}