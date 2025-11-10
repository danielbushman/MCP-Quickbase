import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteRelationshipTool');

/**
 * Parameters for delete_relationship tool
 */
export interface DeleteRelationshipParams {
  /**
   * The ID of the relationship to delete
   */
  relationship_id: number;
}

/**
 * Response from deleting a relationship
 */
export interface DeleteRelationshipResult {
  /**
   * The ID of the deleted relationship
   */
  deletedRelationshipId: number;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for deleting a relationship between Quickbase tables
 */
export class DeleteRelationshipTool extends BaseTool<DeleteRelationshipParams, DeleteRelationshipResult> {
  public name = 'delete_relationship';
  public description = 'Deletes a relationship between Quickbase tables';

  /**
   * Parameter schema for delete_relationship
   */
  public paramSchema = {
    type: 'object',
    properties: {
      relationship_id: {
        type: 'number',
        description: 'The ID of the relationship to delete'
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
   * Run the delete_relationship tool
   * @param params Tool parameters
   * @returns Delete result
   */
  protected async run(params: DeleteRelationshipParams): Promise<DeleteRelationshipResult> {
    const { relationship_id } = params;

    logger.info('Deleting relationship', {
      relationshipId: relationship_id
    });

    // Delete the relationship
    const response = await this.client.request({
      method: 'DELETE',
      path: `/relationships/${relationship_id}`
    });

    if (!response.success) {
      logger.error('Failed to delete relationship', {
        error: response.error,
        relationshipId: relationship_id
      });
      throw new Error(response.error?.message || 'Failed to delete relationship');
    }

    logger.info('Successfully deleted relationship', {
      relationshipId: relationship_id
    });

    return {
      deletedRelationshipId: relationship_id,
      message: `Relationship ${relationship_id} has been deleted`
    };
  }
}
