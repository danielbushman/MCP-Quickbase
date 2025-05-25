import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetTableFieldsTool');

/**
 * Field information returned by get_table_fields
 */
export interface FieldInfo {
  /**
   * The ID of the field
   */
  id: string;
  
  /**
   * The label (display name) of the field
   */
  label: string;
  
  /**
   * The type of the field
   */
  fieldType: string;
  
  /**
   * The description of the field
   */
  description?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether the field is unique
   */
  unique?: boolean;
  
  /**
   * Additional properties of the field
   */
  properties?: Record<string, any>;
  
  /**
   * Additional details about the field
   */
  [key: string]: any;
}

/**
 * Parameters for get_table_fields tool
 */
export interface GetTableFieldsParams {
  /**
   * The ID of the table
   */
  table_id: string;
  
  /**
   * Whether to include system fields
   */
  include_system?: boolean;
  
  /**
   * Filter fields by type
   */
  field_type?: string;
}

/**
 * Response from getting table fields
 */
export interface GetTableFieldsResult {
  /**
   * Array of field information
   */
  fields: FieldInfo[];
  
  /**
   * The table ID that was queried
   */
  tableId: string;
}

/**
 * Tool for retrieving field information for a specific Quickbase table
 */
export class GetTableFieldsTool extends BaseTool<GetTableFieldsParams, GetTableFieldsResult> {
  public name = 'get_table_fields';
  public description = 'Retrieves field information for a specific Quickbase table';
  
  /**
   * Parameter schema for get_table_fields
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      include_system: {
        type: 'boolean',
        description: 'Whether to include system fields'
      },
      field_type: {
        type: 'string',
        description: 'Filter fields by type'
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
   * Run the get_table_fields tool
   * @param params Tool parameters
   * @returns Table field information
   */
  protected async run(params: GetTableFieldsParams): Promise<GetTableFieldsResult> {
    const { table_id, include_system, field_type } = params;
    
    logger.info('Getting fields for Quickbase table', { 
      tableId: table_id,
      includeSystem: include_system
    });
    
    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    
    if (include_system !== undefined) {
      queryParams.includeSystem = include_system.toString();
    }
    
    // Get fields in the table
    const response = await this.client.request({
      method: 'GET',
      path: `/fields?tableId=${table_id}`,
      params: queryParams
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to get table fields', { 
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to get table fields');
    }
    
    // Cast data to array of fields
    let fields = (response.data as Record<string, any>[]).map(field => ({
      id: field.id,
      label: field.label,
      fieldType: field.fieldType,
      description: field.description,
      required: field.required,
      unique: field.unique,
      properties: field.properties,
      ...field
    }));
    
    // Filter fields by type if requested
    if (field_type && field_type.trim() !== '') {
      fields = fields.filter(field => 
        field.fieldType.toLowerCase() === field_type.toLowerCase()
      );
    }
    
    logger.info(`Found ${fields.length} fields in table`, { 
      tableId: table_id,
      fieldTypes: [...new Set(fields.map(f => f.fieldType))].join(', ')
    });
    
    return {
      fields,
      tableId: table_id
    };
  }
}