import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';
import { FieldProperties } from './create_field';

const logger = createLogger('UpdateFieldTool');

/**
 * Parameters for update_field tool
 */
export interface UpdateFieldParams {
  /**
   * The ID of the table containing the field
   */
  table_id: string;
  
  /**
   * The ID of the field to update
   */
  field_id: string;
  
  /**
   * New name for the field
   */
  name?: string;
  
  /**
   * New description for the field
   */
  description?: string;
  
  /**
   * New field type (only allowed for certain field type conversions)
   */
  field_type?: string;
  
  /**
   * Additional options and properties to update
   */
  options?: FieldProperties;
}

/**
 * Response from updating a field
 */
export interface UpdateFieldResult {
  /**
   * The ID of the updated field
   */
  fieldId: string;
  
  /**
   * The updated label/name of the field
   */
  label?: string;
  
  /**
   * The updated type of the field
   */
  fieldType?: string;
  
  /**
   * The updated description of the field
   */
  description?: string;
  
  /**
   * The ID of the table containing the field
   */
  tableId: string;
  
  /**
   * Additional details about the updated field
   */
  [key: string]: any;
}

/**
 * Tool for updating an existing field in a Quickbase table
 */
export class UpdateFieldTool extends BaseTool<UpdateFieldParams, UpdateFieldResult> {
  public name = 'update_field';
  public description = 'Updates an existing field in a Quickbase table';
  
  /**
   * Parameter schema for update_field
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table'
      },
      field_id: {
        type: 'string',
        description: 'The ID of the field'
      },
      name: {
        type: 'string',
        description: 'New name for the field'
      },
      field_type: {
        type: 'string',
        description: 'New type for the field'
      },
      description: {
        type: 'string',
        description: 'New description for the field'
      },
      options: {
        type: 'object',
        description: 'Additional field options'
      }
    },
    required: ['table_id', 'field_id']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the update_field tool
   * @param params Tool parameters
   * @returns Updated field details
   */
  protected async run(params: UpdateFieldParams): Promise<UpdateFieldResult> {
    const { table_id, field_id, name, field_type, description, options } = params;
    
    logger.info('Updating field in Quickbase table', { 
      tableId: table_id,
      fieldId: field_id
    });
    
    // At least one update field is required
    if (!name && !description && !field_type && (!options || Object.keys(options).length === 0)) {
      throw new Error('At least one update field (name, description, field_type, or options) is required');
    }
    
    // Prepare request body with only the fields that are provided
    const body: Record<string, any> = {};
    
    if (name !== undefined) {
      body.label = name;
    }
    
    if (field_type !== undefined) {
      body.fieldType = field_type;
    }
    
    if (description !== undefined) {
      body.description = description;
    }
    
    // Add properties if provided
    if (options && Object.keys(options).length > 0) {
      body.properties = { ...options };
    }
    
    // Update the field (Quickbase uses POST for field updates with the field ID in the path)
    const response = await this.client.request({
      method: 'POST',
      path: `/fields`,
      body: {
        ...body,
        fieldId: field_id,
        tableId: table_id
      }
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to update field', { 
        error: response.error,
        tableId: table_id,
        fieldId: field_id
      });
      throw new Error(response.error?.message || 'Failed to update field');
    }
    
    const field = response.data as Record<string, any>;
    
    logger.info('Successfully updated field', { 
      fieldId: field.id,
      tableId: table_id,
      updates: Object.keys(body).join(', ')
    });
    
    return {
      fieldId: field.id,
      label: field.label,
      fieldType: field.fieldType,
      description: field.description,
      tableId: table_id,
      ...field
    };
  }
}