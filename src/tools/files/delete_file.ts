import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteFileTool');

/**
 * Parameters for delete_file tool
 */
export interface DeleteFileParams {
  /**
   * ID of the table containing the file
   */
  table_id: string;

  /**
   * ID of the record containing the file
   */
  record_id: string;

  /**
   * ID of the field containing the file attachment
   */
  field_id: string;

  /**
   * Version number of the file to delete
   */
  version_number: number;
}

/**
 * Response from deleting a file
 */
export interface DeleteFileResult {
  /**
   * Whether the deletion was successful
   */
  success: boolean;

  /**
   * Confirmation message
   */
  message: string;

  /**
   * The table ID
   */
  tableId: string;

  /**
   * The record ID
   */
  recordId: string;

  /**
   * The field ID
   */
  fieldId: string;

  /**
   * The version number that was deleted
   */
  versionNumber: number;
}

/**
 * Tool for deleting file attachments from Quickbase records
 * Completes the file CRUD operations (Create via upload_file, Read via download_file, Delete via this tool)
 */
export class DeleteFileTool extends BaseTool<DeleteFileParams, DeleteFileResult> {
  public name = 'delete_file';
  public description = 'Delete a file attachment from a Quickbase record field. Requires table ID, record ID, field ID, and version number.';

  /**
   * Parameter schema for delete_file
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'ID of the table containing the file'
      },
      record_id: {
        type: 'string',
        description: 'ID of the record containing the file'
      },
      field_id: {
        type: 'string',
        description: 'ID of the field containing the file attachment'
      },
      version_number: {
        type: 'number',
        description: 'Version number of the file to delete'
      }
    },
    required: ['table_id', 'record_id', 'field_id', 'version_number']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_file tool
   * @param params Tool parameters
   * @returns Deletion confirmation
   */
  protected async run(params: DeleteFileParams): Promise<DeleteFileResult> {
    logger.info('Deleting file from Quickbase record', {
      tableId: params.table_id,
      recordId: params.record_id,
      fieldId: params.field_id,
      version: params.version_number
    });

    const { table_id, record_id, field_id, version_number } = params;

    // Delete the file
    const response = await this.client.request({
      method: 'DELETE',
      path: `/files/${table_id}/${record_id}/${field_id}/${version_number}`
    });

    if (!response.success) {
      logger.error('Failed to delete file', {
        error: response.error,
        params
      });
      throw new Error(response.error?.message || 'Failed to delete file');
    }

    logger.info('Successfully deleted file', {
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      version: version_number
    });

    return {
      success: true,
      message: 'File deleted successfully',
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      versionNumber: version_number
    };
  }
}
