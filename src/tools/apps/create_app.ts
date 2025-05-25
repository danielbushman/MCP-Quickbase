import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CreateAppTool');

/**
 * Parameters for create_app tool
 */
export interface CreateAppParams {
  /**
   * Name of the application to create
   */
  name: string;
  
  /**
   * Description of the application
   */
  description?: string;
  
  /**
   * Additional options for app creation
   */
  options?: Record<string, any>;
}

/**
 * Response from creating an application
 */
export interface CreateAppResult {
  /**
   * The ID of the created application
   */
  appId: string;
  
  /**
   * The name of the created application
   */
  name: string;
  
  /**
   * The description of the created application
   */
  description?: string;
  
  /**
   * The date the application was created
   */
  created?: string;
  
  /**
   * The URL to access the application
   */
  appUrl?: string;
  
  /**
   * Additional details returned from the API
   */
  [key: string]: any;
}

/**
 * Tool for creating a new Quickbase application
 */
export class CreateAppTool extends BaseTool<CreateAppParams, CreateAppResult> {
  public name = 'create_app';
  public description = 'Creates a new Quickbase application. Only use this tool when explicitly asked to create a new application.';
  
  /**
   * Parameter schema for create_app
   */
  public paramSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the application'
      },
      description: {
        type: 'string',
        description: 'Description of the application'
      },
      options: {
        type: 'object',
        description: 'Additional options for app creation'
      }
    },
    required: ['name']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the create_app tool
   * @param params Tool parameters
   * @returns Created application details
   */
  protected async run(params: CreateAppParams): Promise<CreateAppResult> {
    logger.info('Creating new Quickbase application', { name: params.name });
    
    const { name, description, options } = params;
    
    // Prepare request body
    const body: Record<string, any> = {
      name,
      description: description || ''
    };
    
    // Add any additional options
    if (options) {
      Object.assign(body, options);
    }
    
    // Create the application
    const response = await this.client.request({
      method: 'POST',
      path: '/apps',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to create application', { 
        error: response.error,
        params 
      });
      throw new Error(response.error?.message || 'Failed to create application');
    }
    
    const app = response.data as Record<string, any>;
    
    logger.info('Successfully created application', { 
      appId: app.id,
      name: app.name 
    });
    
    return {
      appId: app.id,
      name: app.name,
      description: app.description,
      created: app.created,
      appUrl: app.url,
      ...app
    };
  }
}