import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateTableTool');

/**
 * Parameters for update_table tool
 */
export interface UpdateTableParams {
  /**
   * The ID of the table to update
   */
  table_id: string;
  
  /**
   * New name for the table
   */
  name?: string;
  
  /**
   * New description for the table
   */
  description?: string;
  
  /**
   * Additional options for table update
   */
  options?: Record<string, any>;
}

/**
 * Response from updating a table
 */
export interface UpdateTableResult {
  /**
   * The ID of the updated table
   */
  tableId: string;
  
  /**
   * The updated name of the table
   */
  name?: string;
  
  /**
   * The updated description of the table
   */
  description?: string;
  
  /**
   * The date the table was updated
   */
  updated?: string;
  
  /**
   * Additional details returned from the API
   */
  [key: string]: any;
}

/**
 * Tool for updating an existing table in a Quickbase application
 */
export class UpdateTableTool extends BaseTool<UpdateTableParams, UpdateTableResult> {
  public name = 'update_table';
  public description = 'Updates an existing Quickbase table';
  
  /**
   * Parameter schema for update_table
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table'
      },
      name: {
        type: 'string',
        description: 'New name for the table'
      },
      description: {
        type: 'string',
        description: 'New description for the table'
      },
      options: {
        type: 'object',
        description: 'Additional options for table update'
      }
    },
    required: ['table_id']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the update_table tool
   * @param params Tool parameters
   * @returns Updated table details
   */
  protected async run(params: UpdateTableParams): Promise<UpdateTableResult> {
    logger.info('Updating Quickbase table', { 
      tableId: params.table_id
    });
    
    const { table_id, name, description, options } = params;
    
    // At least one update field is required
    if (!name && !description && (!options || Object.keys(options).length === 0)) {
      throw new Error('At least one update field (name, description, or options) is required');
    }
    
    // Prepare request body with only the fields that are provided
    const body: Record<string, any> = {};
    
    if (name !== undefined) {
      body.name = name;
    }
    
    if (description !== undefined) {
      body.description = description;
    }
    
    // Add any additional options
    if (options) {
      Object.assign(body, options);
    }
    
    // Update the table (Quickbase uses PUT for table updates)
    const response = await this.client.request({
      method: 'PUT',
      path: `/tables/${table_id}`,
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to update table', { 
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to update table');
    }
    
    const table = response.data as Record<string, any>;
    
    logger.info('Successfully updated table', { 
      tableId: table.id,
      updates: Object.keys(body).join(', ')
    });
    
    return {
      tableId: table.id,
      name: table.name,
      description: table.description,
      updated: table.updated || new Date().toISOString(),
      ...table
    };
  }
}