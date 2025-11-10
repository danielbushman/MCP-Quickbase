import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetWebhookTool');

/**
 * Parameters for get_webhook tool
 */
export interface GetWebhookParams {
  /**
   * Webhook ID
   */
  webhook_id: string;
}

/**
 * Detailed webhook information
 */
export interface GetWebhookResult {
  /**
   * Webhook ID
   */
  webhookId: string;

  /**
   * Webhook name
   */
  name?: string;

  /**
   * Table ID
   */
  tableId: string;

  /**
   * Endpoint URL
   */
  endpointUrl: string;

  /**
   * Event types
   */
  eventTypes: string[];

  /**
   * Whether webhook is enabled
   */
  enabled: boolean;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Filter criteria
   */
  filter?: string;

  /**
   * Creation date
   */
  created?: string;

  /**
   * Last modified date
   */
  modified?: string;

  /**
   * Additional webhook details
   */
  [key: string]: any;
}

/**
 * Tool for getting detailed information about a specific webhook
 */
export class GetWebhookTool extends BaseTool<GetWebhookParams, GetWebhookResult> {
  public name = 'get_webhook';
  public description = 'Get detailed information about a specific webhook including configuration, event types, and status.';

  /**
   * Parameter schema for get_webhook
   */
  public paramSchema = {
    type: 'object',
    properties: {
      webhook_id: {
        type: 'string',
        description: 'Webhook ID'
      }
    },
    required: ['webhook_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the get_webhook tool
   * @param params Tool parameters
   * @returns Webhook details
   */
  protected async run(params: GetWebhookParams): Promise<GetWebhookResult> {
    logger.info('Getting webhook details', {
      webhookId: params.webhook_id
    });

    const { webhook_id } = params;

    // Get webhook details
    const response = await this.client.request({
      method: 'GET',
      path: `/webhooks/${webhook_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get webhook', {
        error: response.error,
        webhookId: webhook_id
      });
      throw new Error(response.error?.message || 'Failed to get webhook');
    }

    const webhook = response.data as Record<string, any>;

    logger.info('Successfully retrieved webhook', {
      webhookId: webhook_id,
      tableId: webhook.tableId
    });

    return {
      webhookId: webhook_id,
      name: webhook.name,
      tableId: webhook.tableId,
      endpointUrl: webhook.endpointUrl || webhook.url,
      eventTypes: webhook.eventTypes || [],
      enabled: webhook.enabled !== false,
      headers: webhook.headers,
      filter: webhook.filter,
      created: webhook.created || webhook.createdDate,
      modified: webhook.modified || webhook.modifiedDate,
      ...webhook
    };
  }
}
