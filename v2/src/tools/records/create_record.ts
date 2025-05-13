import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CreateRecordTool');

/**
 * Parameters for create_record tool
 */
export interface CreateRecordParams {
  /**
   * The ID of the table to create the record in
   */
  table_id: string;
  
  /**
   * The data for the new record, formatted as a JSON object
   * with field IDs or field names as keys
   */
  data: Record<string, any>;
}

/**
 * Response from creating a record
 */
export interface CreateRecordResult {
  /**
   * The ID of the created record
   */
  recordId: string;
  
  /**
   * The ID of the table the record was created in
   */
  tableId: string;
  
  /**
   * Creation timestamp
   */
  createdTime?: string;
}

/**
 * Tool for creating a new record in a Quickbase table
 */
export class CreateRecordTool extends BaseTool<CreateRecordParams, CreateRecordResult> {
  public name = 'create_record';
  public description = 'Creates a new record in a Quickbase table';
  
  /**
   * Parameter schema for create_record
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      data: {
        type: 'string',
        description: 'The data for the new record'
      }
    },
    required: ['table_id', 'data']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the create_record tool
   * @param params Tool parameters
   * @returns Created record information
   */
  protected async run(params: CreateRecordParams): Promise<CreateRecordResult> {
    const { table_id, data } = params;
    
    logger.info('Creating new record in Quickbase table', { 
      tableId: table_id
    });
    
    // Validate data
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Record data is required and must be a non-empty object');
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
      data: [recordData]
    };
    
    // Create the record
    const response = await this.client.request({
      method: 'POST',
      path: '/records',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to create record', { 
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to create record');
    }
    
    const result = response.data as Record<string, any>;
    const metadata = result.metadata || {};
    
    if (!metadata.createdRecordIds || metadata.createdRecordIds.length === 0) {
      logger.error('Record creation response missing record ID', { 
        response: result
      });
      throw new Error('Record created but no record ID was returned');
    }
    
    const recordId = metadata.createdRecordIds[0];
    
    logger.info('Successfully created record', { 
      recordId,
      tableId: table_id
    });
    
    return {
      recordId,
      tableId: table_id,
      createdTime: new Date().toISOString()
    };
  }
}