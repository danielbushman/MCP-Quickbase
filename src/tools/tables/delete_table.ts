import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteTableTool');

/**
 * Parameters for delete_table tool
 */
export interface DeleteTableParams {
  /**
   * The ID of the application containing the table
   */
  app_id: string;

  /**
   * The ID of the table to delete
   */
  table_id: string;
}

/**
 * Response from deleting a table
 */
export interface DeleteTableResult {
  /**
   * The ID of the deleted table
   */
  deletedTableId: string;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for deleting a Quickbase table
 */
export class DeleteTableTool extends BaseTool<DeleteTableParams, DeleteTableResult> {
  public name = 'delete_table';
  public description = 'Deletes a Quickbase table';

  /**
   * Parameter schema for delete_table
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'The ID of the application'
      },
      table_id: {
        type: 'string',
        description: 'The ID of the table to delete'
      }
    },
    required: ['app_id', 'table_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_table tool
   * @param params Tool parameters
   * @returns Delete result
   */
  protected async run(params: DeleteTableParams): Promise<DeleteTableResult> {
    const { app_id, table_id } = params;

    logger.info('Deleting Quickbase table', {
      appId: app_id,
      tableId: table_id
    });

    // Delete the table
    const response = await this.client.request({
      method: 'DELETE',
      path: `/tables/${table_id}?appId=${app_id}`
    });

    if (!response.success) {
      logger.error('Failed to delete table', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to delete table');
    }

    logger.info('Successfully deleted table', {
      tableId: table_id
    });

    return {
      deletedTableId: table_id,
      message: `Table ${table_id} has been deleted`
    };
  }
}
