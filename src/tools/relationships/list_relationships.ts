import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListRelationshipsTool');

/**
 * Parameters for list_relationships tool
 */
export interface ListRelationshipsParams {
  /**
   * The ID of the table to list relationships for (optional)
   * If not provided, lists all relationships the user has access to
   */
  table_id?: string;

  /**
   * Filter to show relationships where this table is the parent
   */
  as_parent?: boolean;

  /**
   * Filter to show relationships where this table is the child
   */
  as_child?: boolean;
}

/**
 * Individual relationship information
 */
export interface RelationshipInfo {
  /**
   * The ID of the relationship
   */
  id: number;

  /**
   * The ID of the parent table
   */
  parentTableId: string;

  /**
   * The ID of the child table
   */
  childTableId: string;

  /**
   * The ID of the reference field in the child table
   */
  referenceFieldId?: number;

  /**
   * Lookup fields in the relationship
   */
  lookupFields?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Summary fields in the relationship
   */
  summaryFields?: Array<{
    id: number;
    name: string;
  }>;

  /**
   * Additional relationship metadata
   */
  [key: string]: any;
}

/**
 * Response from listing relationships
 */
export interface ListRelationshipsResult {
  /**
   * Array of relationships
   */
  relationships: RelationshipInfo[];

  /**
   * Total number of relationships found
   */
  total: number;
}

/**
 * Tool for listing relationships in Quickbase
 */
export class ListRelationshipsTool extends BaseTool<ListRelationshipsParams, ListRelationshipsResult> {
  public name = 'list_relationships';
  public description = 'Lists relationships in Quickbase';

  /**
   * Parameter schema for list_relationships
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table (optional)'
      },
      as_parent: {
        type: 'boolean',
        description: 'Filter relationships where table is parent'
      },
      as_child: {
        type: 'boolean',
        description: 'Filter relationships where table is child'
      }
    }
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the list_relationships tool
   * @param params Tool parameters
   * @returns List of relationships
   */
  protected async run(params: ListRelationshipsParams): Promise<ListRelationshipsResult> {
    const { table_id, as_parent, as_child } = params;

    logger.info('Listing relationships', {
      tableId: table_id,
      asParent: as_parent,
      asChild: as_child
    });

    // Build query parameters
    const queryParams: string[] = [];
    if (table_id) {
      queryParams.push(`tableId=${table_id}`);
    }
    if (as_parent !== undefined) {
      queryParams.push(`asParent=${as_parent}`);
    }
    if (as_child !== undefined) {
      queryParams.push(`asChild=${as_child}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Get the relationships
    const response = await this.client.request({
      method: 'GET',
      path: `/relationships${queryString}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to list relationships', {
        error: response.error
      });
      throw new Error(response.error?.message || 'Failed to list relationships');
    }

    const result = response.data as Record<string, any>;
    const relationships = Array.isArray(result) ? result : (result.relationships || []);

    logger.info(`Successfully retrieved ${relationships.length} relationships`, {
      relationshipCount: relationships.length
    });

    return {
      relationships,
      total: relationships.length
    };
  }
}
