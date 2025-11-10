import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteAppTool');

/**
 * Parameters for delete_app tool
 */
export interface DeleteAppParams {
  /**
   * The ID of the application to delete
   */
  app_id: string;

  /**
   * The name of the application (for confirmation)
   */
  name: string;
}

/**
 * Response from deleting an application
 */
export interface DeleteAppResult {
  /**
   * The ID of the deleted application
   */
  deletedAppId: string;

  /**
   * Success message
   */
  message: string;
}

/**
 * Tool for deleting a Quickbase application
 */
export class DeleteAppTool extends BaseTool<DeleteAppParams, DeleteAppResult> {
  public name = 'delete_app';
  public description = 'Deletes a Quickbase application';

  /**
   * Parameter schema for delete_app
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'The ID of the application to delete'
      },
      name: {
        type: 'string',
        description: 'The name of the application (for confirmation)'
      }
    },
    required: ['app_id', 'name']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_app tool
   * @param params Tool parameters
   * @returns Delete result
   */
  protected async run(params: DeleteAppParams): Promise<DeleteAppResult> {
    const { app_id, name } = params;

    logger.info('Deleting Quickbase application', {
      appId: app_id,
      name
    });

    // Delete the application
    const response = await this.client.request({
      method: 'DELETE',
      path: `/apps/${app_id}`,
      body: {
        name,
        appId: app_id
      }
    });

    if (!response.success) {
      logger.error('Failed to delete application', {
        error: response.error,
        appId: app_id
      });
      throw new Error(response.error?.message || 'Failed to delete application');
    }

    logger.info('Successfully deleted application', {
      appId: app_id
    });

    return {
      deletedAppId: app_id,
      message: `Application ${name} (${app_id}) has been deleted`
    };
  }
}
