import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CreateRelationshipTool');

/**
 * Parameters for create_relationship tool
 */
export interface CreateRelationshipParams {
  /**
   * The ID of the parent (one-side) table
   */
  parent_table_id: string;

  /**
   * The ID of the child (many-side) table
   */
  child_table_id: string;

  /**
   * Array of fields to create lookup/summary fields from parent to child
   */
  lookup_fields?: Array<{
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
   * Array of summary fields to create
   */
  summary_fields?: Array<{
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
 * Response from creating a relationship
 */
export interface CreateRelationshipResult {
  /**
   * The ID of the relationship
   */
  relationshipId?: number;

  /**
   * The ID of the reference field created in the child table
   */
  childFieldId?: number;

  /**
   * Lookup fields created
   */
  lookupFields?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Summary fields created
   */
  summaryFields?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for creating a relationship between two Quickbase tables
 */
export class CreateRelationshipTool extends BaseTool<CreateRelationshipParams, CreateRelationshipResult> {
  public name = 'create_relationship';
  public description = 'Creates a relationship between two Quickbase tables';

  /**
   * Parameter schema for create_relationship
   */
  public paramSchema = {
    type: 'object',
    properties: {
      parent_table_id: {
        type: 'string',
        description: 'The ID of the parent (one-side) table'
      },
      child_table_id: {
        type: 'string',
        description: 'The ID of the child (many-side) table'
      },
      lookup_fields: {
        type: 'array',
        description: 'Array of lookup fields to create',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parent_field_id: { type: 'number' }
          }
        }
      },
      summary_fields: {
        type: 'array',
        description: 'Array of summary fields to create',
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
    required: ['parent_table_id', 'child_table_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the create_relationship tool
   * @param params Tool parameters
   * @returns Relationship creation result
   */
  protected async run(params: CreateRelationshipParams): Promise<CreateRelationshipResult> {
    const { parent_table_id, child_table_id, lookup_fields, summary_fields } = params;

    logger.info('Creating relationship between Quickbase tables', {
      parentTableId: parent_table_id,
      childTableId: child_table_id
    });

    // Prepare request body
    const body: Record<string, any> = {
      parentTableId: parent_table_id,
      childTableId: child_table_id
    };

    if (lookup_fields && lookup_fields.length > 0) {
      body.lookupFields = lookup_fields;
    }

    if (summary_fields && summary_fields.length > 0) {
      body.summaryFields = summary_fields;
    }

    // Create the relationship
    const response = await this.client.request({
      method: 'POST',
      path: '/relationships',
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to create relationship', {
        error: response.error,
        parentTableId: parent_table_id,
        childTableId: child_table_id
      });
      throw new Error(response.error?.message || 'Failed to create relationship');
    }

    const result = response.data as Record<string, any>;

    logger.info('Successfully created relationship', {
      relationshipId: result.relationshipId,
      parentTableId: parent_table_id,
      childTableId: child_table_id
    });

    return {
      relationshipId: result.relationshipId,
      childFieldId: result.childFieldId,
      lookupFields: result.lookupFields,
      summaryFields: result.summaryFields,
      message: `Relationship created between ${parent_table_id} and ${child_table_id}`
    };
  }
}
