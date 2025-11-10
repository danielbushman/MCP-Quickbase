import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetTableTool');

/**
 * Parameters for get_table tool
 */
export interface GetTableParams {
  /**
   * The ID of the application containing the table
   */
  app_id: string;

  /**
   * The ID of the table to retrieve
   */
  table_id: string;
}

/**
 * Response from getting a table
 */
export interface GetTableResult {
  /**
   * The ID of the table
   */
  id: string;

  /**
   * The name of the table
   */
  name: string;

  /**
   * The description of the table
   */
  description?: string;

  /**
   * When the table was created
   */
  created?: string;

  /**
   * When the table was last updated
   */
  updated?: string;

  /**
   * The next record ID that will be assigned
   */
  nextRecordId?: number;

  /**
   * The next field ID that will be assigned
   */
  nextFieldId?: number;

  /**
   * Additional table metadata
   */
  [key: string]: any;
}

/**
 * Tool for retrieving details of a Quickbase table
 */
export class GetTableTool extends BaseTool<GetTableParams, GetTableResult> {
  public name = 'get_table';
  public description = 'Gets details of a specific Quickbase table';

  /**
   * Parameter schema for get_table
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
        description: 'The ID of the table'
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
   * Run the get_table tool
   * @param params Tool parameters
   * @returns Table details
   */
  protected async run(params: GetTableParams): Promise<GetTableResult> {
    const { app_id, table_id } = params;

    logger.info('Getting Quickbase table details', {
      appId: app_id,
      tableId: table_id
    });

    // Get the table
    const response = await this.client.request({
      method: 'GET',
      path: `/tables/${table_id}?appId=${app_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get table', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to get table');
    }

    const table = response.data as GetTableResult;

    logger.info('Successfully retrieved table', {
      tableId: table.id,
      name: table.name
    });

    return table;
  }
}
