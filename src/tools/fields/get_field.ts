import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetFieldTool');

/**
 * Parameters for get_field tool
 */
export interface GetFieldParams {
  /**
   * The ID of the table containing the field
   */
  table_id: string;

  /**
   * The ID of the field to retrieve
   */
  field_id: string;
}

/**
 * Response from getting a field
 */
export interface GetFieldResult {
  /**
   * The ID of the field
   */
  id: number;

  /**
   * The label/name of the field
   */
  label: string;

  /**
   * The type of the field
   */
  fieldType: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is unique
   */
  unique?: boolean;

  /**
   * Whether the field appears on forms by default
   */
  appearsByDefault?: boolean;

  /**
   * Field properties
   */
  properties?: Record<string, any>;

  /**
   * Additional field metadata
   */
  [key: string]: any;
}

/**
 * Tool for retrieving details of a Quickbase field
 */
export class GetFieldTool extends BaseTool<GetFieldParams, GetFieldResult> {
  public name = 'get_field';
  public description = 'Gets details of a specific field in a Quickbase table';

  /**
   * Parameter schema for get_field
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
   * Run the get_field tool
   * @param params Tool parameters
   * @returns Field details
   */
  protected async run(params: GetFieldParams): Promise<GetFieldResult> {
    const { table_id, field_id } = params;

    logger.info('Getting Quickbase field details', {
      tableId: table_id,
      fieldId: field_id
    });

    // Get the field
    const response = await this.client.request({
      method: 'GET',
      path: `/fields/${field_id}?tableId=${table_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get field', {
        error: response.error,
        fieldId: field_id
      });
      throw new Error(response.error?.message || 'Failed to get field');
    }

    const field = response.data as GetFieldResult;

    logger.info('Successfully retrieved field', {
      fieldId: field.id,
      label: field.label
    });

    return field;
  }
}
