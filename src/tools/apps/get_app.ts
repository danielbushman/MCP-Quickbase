import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetAppTool');

/**
 * Parameters for get_app tool
 */
export interface GetAppParams {
  /**
   * The ID of the application to retrieve
   */
  app_id: string;
}

/**
 * Response from getting an application
 */
export interface GetAppResult {
  /**
   * The ID of the application
   */
  id: string;

  /**
   * The name of the application
   */
  name: string;

  /**
   * The description of the application
   */
  description?: string;

  /**
   * When the application was created
   */
  created?: string;

  /**
   * When the application was last updated
   */
  updated?: string;

  /**
   * Additional application metadata
   */
  [key: string]: any;
}

/**
 * Tool for retrieving details of a Quickbase application
 */
export class GetAppTool extends BaseTool<GetAppParams, GetAppResult> {
  public name = 'get_app';
  public description = 'Gets details of a specific Quickbase application';

  /**
   * Parameter schema for get_app
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'The ID of the application'
      }
    },
    required: ['app_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the get_app tool
   * @param params Tool parameters
   * @returns Application details
   */
  protected async run(params: GetAppParams): Promise<GetAppResult> {
    const { app_id } = params;

    logger.info('Getting Quickbase application details', {
      appId: app_id
    });

    // Get the application
    const response = await this.client.request({
      method: 'GET',
      path: `/apps/${app_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get application', {
        error: response.error,
        appId: app_id
      });
      throw new Error(response.error?.message || 'Failed to get application');
    }

    const app = response.data as GetAppResult;

    logger.info('Successfully retrieved application', {
      appId: app.id,
      name: app.name
    });

    return app;
  }
}
