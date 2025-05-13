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
    
    // Read the file
    const fileBuffer = readFileAsBuffer(file_path);
    if (!fileBuffer) {
      throw new Error(`Unable to read file: ${file_path}`);
    }
    
    // Convert Buffer to base64
    const fileBase64 = fileBuffer.toString('base64');
    
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