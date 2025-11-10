import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteRecordsTool');

/**
 * Parameters for delete_records tool
 */
export interface DeleteRecordsParams {
  /**
   * The ID of the table containing the records
   */
  table_id: string;

  /**
   * Array of record IDs to delete
   */
  record_ids: number[];
}

/**
 * Response from deleting records
 */
export interface DeleteRecordsResult {
  /**
   * Number of records deleted
   */
  numberDeleted: number;

  /**
   * The ID of the table
   */
  tableId: string;
}

/**
 * Tool for deleting records from a Quickbase table
 */
export class DeleteRecordsTool extends BaseTool<DeleteRecordsParams, DeleteRecordsResult> {
  public name = 'delete_records';
  public description = 'Deletes records from a Quickbase table';

  /**
   * Parameter schema for delete_records
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      record_ids: {
        type: 'array',
        description: 'Array of record IDs to delete',
        items: {
          type: 'number'
        },
        minItems: 1
      }
    },
    required: ['table_id', 'record_ids']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_records tool
   * @param params Tool parameters
   * @returns Delete result
   */
  protected async run(params: DeleteRecordsParams): Promise<DeleteRecordsResult> {
    const { table_id, record_ids } = params;

    logger.info(`Deleting ${record_ids.length} records from Quickbase table`, {
      tableId: table_id,
      recordCount: record_ids.length
    });

    // Validate record_ids
    if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
      throw new Error('record_ids array is required and must not be empty');
    }

    // Prepare request body
    const body = {
      from: table_id,
      where: `{3.EX.${record_ids.join('\\,')}}`  // Field 3 is Record ID, EX means "equals one of"
    };

    // Delete the records
    const response = await this.client.request({
      method: 'DELETE',
      path: '/records',
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to delete records', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to delete records');
    }

    const result = response.data as Record<string, any>;
    const numberDeleted = result.numberDeleted || 0;

    logger.info(`Successfully deleted ${numberDeleted} records`, {
      numberDeleted,
      tableId: table_id
    });

    return {
      numberDeleted,
      tableId: table_id
    };
  }
}
