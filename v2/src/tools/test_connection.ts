import { BaseTool } from './base';
import { QuickbaseClient } from '../client/quickbase';
import { createLogger } from '../utils/logger';

const logger = createLogger('TestConnectionTool');

/**
 * Test connection parameters
 */
export interface TestConnectionParams {
  // No parameters needed for test_connection
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  connected: boolean;
  userInfo?: {
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
  realmInfo?: {
    hostname: string;
    id: string;
    [key: string]: any;
  };
  errorMessage?: string;
}

/**
 * Tool for testing the connection to Quickbase
 */
export class TestConnectionTool extends BaseTool<TestConnectionParams, TestConnectionResult> {
  public name = 'test_connection';
  public description = 'Tests the connection to Quickbase';
  
  /**
   * Parameter schema for test_connection
   */
  public paramSchema = {
    type: 'object',
    properties: {},
    required: []
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the test_connection tool
   * @param params Tool parameters (none required)
   * @returns Test result
   */
  protected async run(_params: TestConnectionParams): Promise<TestConnectionResult> {
    logger.info('Testing connection to Quickbase');
    
    try {
      // Call the userinfo endpoint to test the connection
      const response = await this.client.request({
        method: 'GET',
        path: '/userinfo'
      });
      
      if (!response.success) {
        logger.error('Connection test failed', { error: response.error });
        return {
          connected: false,
          errorMessage: response.error?.message || 'Failed to connect to Quickbase'
        };
      }
      
      const userInfo = response.data as Record<string, any>;
      logger.info('Connection test successful', { userId: userInfo.id });
      
      return {
        connected: true,
        userInfo: {
          id: userInfo.id || '',
          email: userInfo.email || '',
          name: userInfo.name || '',
          ...userInfo
        },
        realmInfo: {
          hostname: this.client.getConfig().realmHost,
          id: userInfo.realmId || '',
        }
      };
    } catch (error) {
      logger.error('Error testing connection', { error });
      return {
        connected: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}