import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateRecordTool');

/**
 * Parameters for update_record tool
 */
export interface UpdateRecordParams {
  /**
   * The ID of the table containing the record
   */
  table_id: string;
  
  /**
   * The ID of the record to update
   */
  record_id: string;
  
  /**
   * The data to update in the record, formatted as a JSON object
   * with field IDs or field names as keys
   */
  data: Record<string, any>;
}

/**
 * Response from updating a record
 */
export interface UpdateRecordResult {
  /**
   * The ID of the updated record
   */
  recordId: string;
  
  /**
   * The ID of the table containing the record
   */
  tableId: string;
  
  /**
   * Update timestamp
   */
  updatedTime?: string;
  
  /**
   * Fields that were updated
   */
  updatedFields?: string[];
}

/**
 * Tool for updating an existing record in a Quickbase table
 */
export class UpdateRecordTool extends BaseTool<UpdateRecordParams, UpdateRecordResult> {
  public name = 'update_record';
  public description = 'Updates an existing record in a Quickbase table';
  
  /**
   * Parameter schema for update_record
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      record_id: {
        type: 'string',
        description: 'The ID of the record to update'
      },
      data: {
        type: 'object',
        description: 'The updated data for the record',
        additionalProperties: true
      }
    },
    required: ['table_id', 'record_id', 'data']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the update_record tool
   * @param params Tool parameters
   * @returns Updated record information
   */
  protected async run(params: UpdateRecordParams): Promise<UpdateRecordResult> {
    const { table_id, record_id, data } = params;
    
    logger.info('Updating record in Quickbase table', { 
      tableId: table_id,
      recordId: record_id
    });
    
    // Validate data
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Update data is required and must be a non-empty object');
    }
    
    // Prepare record data
    // Convert data to { [fieldId]: { value: fieldValue } } format expected by the API
    const recordData: Record<string, { value: any }> = {};
    
    for (const [field, value] of Object.entries(data)) {
      recordData[field] = { value };
    }
    
    // Prepare request body
    const body: Record<string, any> = {
      to: table_id,
      data: [{
        id: record_id,
        ...recordData
      }]
    };
    
    // Update the record
    const response = await this.client.request({
      method: 'POST',
      path: '/records',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to update record', { 
        error: response.error,
        tableId: table_id,
        recordId: record_id
      });
      throw new Error(response.error?.message || 'Failed to update record');
    }
    
    logger.info('Successfully updated record', { 
      recordId: record_id,
      tableId: table_id,
      updatedFields: Object.keys(data)
    });
    
    return {
      recordId: record_id,
      tableId: table_id,
      updatedTime: new Date().toISOString(),
      updatedFields: Object.keys(data)
    };
  }
}