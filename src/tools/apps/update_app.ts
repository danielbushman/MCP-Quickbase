import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateAppTool');

/**
 * Parameters for update_app tool
 */
export interface UpdateAppParams {
  /**
   * The ID of the application to update
   */
  app_id: string;
  
  /**
   * New name for the application
   */
  name?: string;
  
  /**
   * New description for the application
   */
  description?: string;
  
  /**
   * Additional options for app update
   */
  options?: Record<string, any>;
}

/**
 * Response from updating an application
 */
export interface UpdateAppResult {
  /**
   * The ID of the updated application
   */
  appId: string;
  
  /**
   * The updated name of the application
   */
  name?: string;
  
  /**
   * The updated description of the application
   */
  description?: string;
  
  /**
   * The date the application was updated
   */
  updated?: string;
  
  /**
   * Additional details returned from the API
   */
  [key: string]: any;
}

/**
 * Tool for updating an existing Quickbase application
 */
export class UpdateAppTool extends BaseTool<UpdateAppParams, UpdateAppResult> {
  public name = 'update_app';
  public description = 'Updates an existing Quickbase application';
  
  /**
   * Parameter schema for update_app
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'The ID of the application'
      },
      name: {
        type: 'string',
        description: 'New name for the application'
      },
      description: {
        type: 'string',
        description: 'New description for the application'
      },
      options: {
        type: 'object',
        description: 'Additional options for app update'
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
   * Run the update_app tool
   * @param params Tool parameters
   * @returns Updated application details
   */
  protected async run(params: UpdateAppParams): Promise<UpdateAppResult> {
    logger.info('Updating Quickbase application', { 
      appId: params.app_id
    });
    
    const { app_id, name, description, options } = params;
    
    // At least one update field is required
    if (!name && !description && (!options || Object.keys(options).length === 0)) {
      throw new Error('At least one update field (name, description, or options) is required');
    }
    
    // Prepare request body with only the fields that are provided
    const body: Record<string, any> = {};
    
    if (name !== undefined) {
      body.name = name;
    }
    
    if (description !== undefined) {
      body.description = description;
    }
    
    // Add any additional options
    if (options) {
      Object.assign(body, options);
    }
    
    // Update the application (Quickbase uses PUT for app updates)
    const response = await this.client.request({
      method: 'PUT',
      path: `/apps/${app_id}`,
      body
    });

    if (!response.success || !response.data) {
      // Provide better error messages for common failures
      const errorMessage = response.error?.message || 'Failed to update application';
      const errorCode = response.error?.code;

      if (errorCode === 401) {
        logger.error('Unauthorized: Insufficient permissions to update application', {
          error: response.error,
          appId: app_id
        });
        throw new Error(`Unauthorized: You don't have permission to update this application (${app_id}). ` +
          'Please verify your API token has the necessary permissions.');
      } else if (errorCode === 403) {
        logger.error('Forbidden: Access denied to update application', {
          error: response.error,
          appId: app_id
        });
        throw new Error(`Forbidden: Access denied to update application (${app_id}). ` +
          'You may not be the application owner or lack required permissions.');
      }

      logger.error('Failed to update application', {
        error: response.error,
        appId: app_id
      });
      throw new Error(errorMessage);
    }
    
    const app = response.data as Record<string, any>;
    
    logger.info('Successfully updated application', { 
      appId: app.id,
      updates: Object.keys(body).join(', ')
    });
    
    return {
      appId: app.id,
      name: app.name,
      description: app.description,
      updated: app.updated || new Date().toISOString(),
      ...app
    };
  }
}