import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('BulkUpdateRecordsTool');

/**
 * Parameters for bulk_update_records tool
 */
export interface BulkUpdateRecordsParams {
  /**
   * The ID of the table containing the records
   */
  table_id: string;
  
  /**
   * Array of record data to update (must include record IDs)
   */
  records: Array<Record<string, any> & { id: string }>;
}

/**
 * Response from bulk updating records
 */
export interface BulkUpdateRecordsResult {
  /**
   * Array of updated record IDs
   */
  recordIds: string[];
  
  /**
   * The ID of the table containing the records
   */
  tableId: string;
  
  /**
   * Number of records updated
   */
  updatedCount: number;
  
  /**
   * Update timestamp
   */
  updatedTime?: string;
}

/**
 * Tool for updating multiple records in a Quickbase table
 */
export class BulkUpdateRecordsTool extends BaseTool<BulkUpdateRecordsParams, BulkUpdateRecordsResult> {
  public name = 'bulk_update_records';
  public description = 'Updates multiple records in a Quickbase table';
  
  /**
   * Parameter schema for bulk_update_records
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      records: {
        type: 'array',
        description: 'Array of record data to update (must include record IDs)',
        items: {
          type: 'object',
          additionalProperties: true
        }
      }
    },
    required: ['table_id', 'records']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the bulk_update_records tool
   * @param params Tool parameters
   * @returns Bulk update result
   */
  protected async run(params: BulkUpdateRecordsParams): Promise<BulkUpdateRecordsResult> {
    const { table_id, records } = params;
    
    logger.info(`Bulk updating ${records.length} records in Quickbase table`, { 
      tableId: table_id,
      recordCount: records.length
    });
    
    // Validate records
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new Error('Records array is required and must not be empty');
    }
    
    // Check if all records have IDs
    const missingIds = records.some(record => !record.id);
    if (missingIds) {
      throw new Error('All records must include an "id" field for bulk updates');
    }
    
    // Prepare record data
    const formattedRecords = records.map(record => {
      const { id, ...fields } = record;
      const recordData: Record<string, any> = { id };
      
      for (const [field, value] of Object.entries(fields)) {
        recordData[field] = { value };
      }
      
      return recordData;
    });
    
    // Prepare request body
    const body: Record<string, any> = {
      to: table_id,
      data: formattedRecords
    };
    
    // Update the records
    const response = await this.client.request({
      method: 'POST',
      path: '/records',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to bulk update records', { 
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to bulk update records');
    }
    
    const recordIds = records.map(record => record.id);
    
    logger.info(`Successfully updated ${recordIds.length} records`, { 
      recordCount: recordIds.length,
      tableId: table_id
    });
    
    return {
      recordIds,
      tableId: table_id,
      updatedCount: recordIds.length,
      updatedTime: new Date().toISOString()
    };
  }
}