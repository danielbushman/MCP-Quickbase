import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateRelationshipTool');

/**
 * Parameters for update_relationship tool
 */
export interface UpdateRelationshipParams {
  /**
   * The ID of the relationship to update
   */
  relationship_id: number;

  /**
   * Add lookup fields to the relationship
   */
  add_lookup_fields?: Array<{
    /**
     * The name of the field in the child table
     */
    name: string;
    /**
     * The ID of the field in the parent table to lookup
     */
    parent_field_id: number;
  }>;

  /**
   * Add summary fields to the relationship
   */
  add_summary_fields?: Array<{
    /**
     * The name of the summary field
     */
    name: string;
    /**
     * The ID of the child field to summarize
     */
    child_field_id: number;
    /**
     * The accumulation type (e.g., "SUM", "AVG", "COUNT", "MAX", "MIN")
     */
    accumulation_type: string;
  }>;
}

/**
 * Response from updating a relationship
 */
export interface UpdateRelationshipResult {
  /**
   * The ID of the relationship
   */
  relationshipId: number;

  /**
   * Lookup fields added
   */
  lookupFieldsAdded?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Summary fields added
   */
  summaryFieldsAdded?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for updating a relationship between Quickbase tables
 */
export class UpdateRelationshipTool extends BaseTool<UpdateRelationshipParams, UpdateRelationshipResult> {
  public name = 'update_relationship';
  public description = 'Updates a relationship between Quickbase tables';

  /**
   * Parameter schema for update_relationship
   */
  public paramSchema = {
    type: 'object',
    properties: {
      relationship_id: {
        type: 'number',
        description: 'The ID of the relationship to update'
      },
      add_lookup_fields: {
        type: 'array',
        description: 'Array of lookup fields to add',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parent_field_id: { type: 'number' }
          }
        }
      },
      add_summary_fields: {
        type: 'array',
        description: 'Array of summary fields to add',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            child_field_id: { type: 'number' },
            accumulation_type: { type: 'string' }
          }
        }
      }
    },
    required: ['relationship_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the update_relationship tool
   * @param params Tool parameters
   * @returns Relationship update result
   */
  protected async run(params: UpdateRelationshipParams): Promise<UpdateRelationshipResult> {
    const { relationship_id, add_lookup_fields, add_summary_fields } = params;

    logger.info('Updating relationship', {
      relationshipId: relationship_id
    });

    // At least one update field is required
    if ((!add_lookup_fields || add_lookup_fields.length === 0) &&
        (!add_summary_fields || add_summary_fields.length === 0)) {
      throw new Error('At least one of add_lookup_fields or add_summary_fields is required');
    }

    // Prepare request body
    const body: Record<string, any> = {};

    if (add_lookup_fields && add_lookup_fields.length > 0) {
      body.addLookupFields = add_lookup_fields;
    }

    if (add_summary_fields && add_summary_fields.length > 0) {
      body.addSummaryFields = add_summary_fields;
    }

    // Update the relationship
    const response = await this.client.request({
      method: 'PUT',
      path: `/relationships/${relationship_id}`,
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to update relationship', {
        error: response.error,
        relationshipId: relationship_id
      });
      throw new Error(response.error?.message || 'Failed to update relationship');
    }

    const result = response.data as Record<string, any>;

    logger.info('Successfully updated relationship', {
      relationshipId: relationship_id
    });

    return {
      relationshipId: relationship_id,
      lookupFieldsAdded: result.lookupFieldsAdded,
      summaryFieldsAdded: result.summaryFieldsAdded,
      message: `Relationship ${relationship_id} has been updated`
    };
  }
}
