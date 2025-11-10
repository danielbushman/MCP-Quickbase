import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteFieldsTool');

/**
 * Parameters for delete_fields tool
 */
export interface DeleteFieldsParams {
  /**
   * The ID of the table containing the fields
   */
  table_id: string;

  /**
   * Array of field IDs to delete
   */
  field_ids: string[];
}

/**
 * Response from deleting fields
 */
export interface DeleteFieldsResult {
  /**
   * Array of deleted field IDs
   */
  deletedFieldIds: string[];

  /**
   * Errors encountered during deletion (if any)
   */
  errors?: Array<{
    fieldId: string;
    message: string;
  }>;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for deleting fields from a Quickbase table
 */
export class DeleteFieldsTool extends BaseTool<DeleteFieldsParams, DeleteFieldsResult> {
  public name = 'delete_fields';
  public description = 'Deletes fields from a Quickbase table';

  /**
   * Parameter schema for delete_fields
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table'
      },
      field_ids: {
        type: 'array',
        description: 'Array of field IDs to delete',
        items: {
          type: 'string'
        },
        minItems: 1
      }
    },
    required: ['table_id', 'field_ids']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_fields tool
   * @param params Tool parameters
   * @returns Delete result
   */
  protected async run(params: DeleteFieldsParams): Promise<DeleteFieldsResult> {
    const { table_id, field_ids } = params;

    logger.info(`Deleting ${field_ids.length} fields from Quickbase table`, {
      tableId: table_id,
      fieldCount: field_ids.length
    });

    // Validate field_ids
    if (!field_ids || !Array.isArray(field_ids) || field_ids.length === 0) {
      throw new Error('field_ids array is required and must not be empty');
    }

    // Delete the fields
    const response = await this.client.request({
      method: 'DELETE',
      path: `/fields?tableId=${table_id}`,
      body: {
        fieldIds: field_ids
      }
    });

    if (!response.success || !response.data) {
      logger.error('Failed to delete fields', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to delete fields');
    }

    const result = response.data as Record<string, any>;
    const deletedFieldIds = result.deletedFieldIds || field_ids;
    const errors = result.errors || [];

    logger.info(`Successfully deleted ${deletedFieldIds.length} fields`, {
      deletedCount: deletedFieldIds.length,
      tableId: table_id
    });

    return {
      deletedFieldIds,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedFieldIds.length} field(s)`
    };
  }
}
