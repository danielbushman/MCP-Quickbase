import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CopyAppTool');

/**
 * Parameters for copy_app tool
 */
export interface CopyAppParams {
  /**
   * ID of the application to copy
   */
  app_id: string;

  /**
   * Name for the copied application
   */
  name: string;

  /**
   * Description for the copied application
   */
  description?: string;

  /**
   * Properties to include/exclude in the copy
   */
  properties?: {
    /**
     * Whether to copy data along with schema
     */
    keepData?: boolean;

    /**
     * Whether to copy user assignments
     */
    assignUserToken?: boolean;

    /**
     * Whether to exclude personnel
     */
    excludeFiles?: boolean;

    /**
     * Additional copy options
     */
    [key: string]: any;
  };
}

/**
 * Response from copying an application
 */
export interface CopyAppResult {
  /**
   * The ID of the copied application
   */
  appId: string;

  /**
   * The name of the copied application
   */
  name: string;

  /**
   * The description of the copied application
   */
  description?: string;

  /**
   * The date the application was created
   */
  created?: string;

  /**
   * The URL to access the copied application
   */
  appUrl?: string;

  /**
   * Status of the copy operation
   */
  status?: string;

  /**
   * Additional details returned from the API
   */
  [key: string]: any;
}

/**
 * Tool for copying/duplicating a Quickbase application
 * Useful for creating test environments or templates
 */
export class CopyAppTool extends BaseTool<CopyAppParams, CopyAppResult> {
  public name = 'copy_app';
  public description = 'Copy/duplicate a Quickbase application. Useful for creating test environments, templates, or backups. Can optionally include data.';

  /**
   * Parameter schema for copy_app
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'ID of the application to copy'
      },
      name: {
        type: 'string',
        description: 'Name for the copied application'
      },
      description: {
        type: 'string',
        description: 'Description for the copied application'
      },
      properties: {
        type: 'object',
        description: 'Copy options and properties',
        properties: {
          keepData: {
            type: 'boolean',
            description: 'Whether to copy data along with schema (default: false)'
          },
          assignUserToken: {
            type: 'boolean',
            description: 'Whether to assign to current user token'
          },
          excludeFiles: {
            type: 'boolean',
            description: 'Whether to exclude file attachments'
          }
        }
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
   * Run the copy_app tool
   * @param params Tool parameters
   * @returns Copied application details
   */
  protected async run(params: CopyAppParams): Promise<CopyAppResult> {
    logger.info('Copying Quickbase application', {
      appId: params.app_id,
      newName: params.name
    });

    const { app_id, name, description, properties } = params;

    // Prepare request body
    const body: Record<string, any> = {
      name,
      description: description || `Copy of ${name}`
    };

    // Add copy properties if provided
    if (properties) {
      body.properties = properties;
    }

    // Copy the application
    const response = await this.client.request({
      method: 'POST',
      path: `/apps/${app_id}/copy`,
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to copy application', {
        error: response.error,
        appId: app_id
      });
      throw new Error(response.error?.message || 'Failed to copy application');
    }

    const app = response.data as Record<string, any>;

    logger.info('Successfully copied application', {
      originalAppId: app_id,
      newAppId: app.id || app.appId,
      name: app.name
    });

    return {
      appId: app.id || app.appId,
      name: app.name,
      description: app.description,
      created: app.created || app.createdDate,
      appUrl: app.url || app.appUrl,
      status: app.status || 'created',
      ...app
    };
  }
}
