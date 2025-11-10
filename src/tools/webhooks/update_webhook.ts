import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UpdateWebhookTool');

/**
 * Parameters for update_webhook tool
 */
export interface UpdateWebhookParams {
  /**
   * Webhook ID
   */
  webhook_id: string;

  /**
   * New endpoint URL
   */
  endpoint_url?: string;

  /**
   * New event types
   */
  event_types?: string[];

  /**
   * New webhook name
   */
  name?: string;

  /**
   * Whether webhook is enabled
   */
  enabled?: boolean;

  /**
   * New headers
   */
  headers?: Record<string, string>;

  /**
   * New filter criteria
   */
  filter?: string;
}

/**
 * Response from updating a webhook
 */
export interface UpdateWebhookResult {
  /**
   * Webhook ID
   */
  webhookId: string;

  /**
   * Updated webhook details
   */
  updated: boolean;

  /**
   * Current webhook configuration
   */
  webhook: {
    tableId: string;
    endpointUrl: string;
    eventTypes: string[];
    enabled: boolean;
    [key: string]: any;
  };

  /**
   * Additional metadata
   */
  [key: string]: any;
}

/**
 * Tool for updating webhook configuration
 */
export class UpdateWebhookTool extends BaseTool<UpdateWebhookParams, UpdateWebhookResult> {
  public name = 'update_webhook';
  public description = 'Update webhook configuration including endpoint URL, event types, enabled status, headers, and filters.';

  /**
   * Parameter schema for update_webhook
   */
  public paramSchema = {
    type: 'object',
    properties: {
      webhook_id: {
        type: 'string',
        description: 'Webhook ID'
      },
      endpoint_url: {
        type: 'string',
        description: 'New endpoint URL (must be HTTPS)'
      },
      event_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'New event types'
      },
      name: {
        type: 'string',
        description: 'New webhook name'
      },
      enabled: {
        type: 'boolean',
        description: 'Whether webhook is enabled'
      },
      headers: {
        type: 'object',
        description: 'New headers'
      },
      filter: {
        type: 'string',
        description: 'New filter criteria'
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
   * Run the update_webhook tool
   * @param params Tool parameters
   * @returns Updated webhook details
   */
  protected async run(params: UpdateWebhookParams): Promise<UpdateWebhookResult> {
    logger.info('Updating webhook', {
      webhookId: params.webhook_id
    });

    const { webhook_id, endpoint_url, event_types, name, enabled, headers, filter } = params;

    // Prepare request body with only provided fields
    const body: Record<string, any> = {};
    if (endpoint_url !== undefined) body.endpointUrl = endpoint_url;
    if (event_types !== undefined) body.eventTypes = event_types;
    if (name !== undefined) body.name = name;
    if (enabled !== undefined) body.enabled = enabled;
    if (headers !== undefined) body.headers = headers;
    if (filter !== undefined) body.filter = filter;

    // Update the webhook
    const response = await this.client.request({
      method: 'PUT',
      path: `/webhooks/${webhook_id}`,
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to update webhook', {
        error: response.error,
        webhookId: webhook_id
      });
      throw new Error(response.error?.message || 'Failed to update webhook');
    }

    const data = response.data as Record<string, any>;

    logger.info('Successfully updated webhook', {
      webhookId: webhook_id
    });

    return {
      webhookId: webhook_id,
      updated: true,
      webhook: {
        tableId: data.tableId,
        endpointUrl: data.endpointUrl || data.url,
        eventTypes: data.eventTypes || [],
        enabled: data.enabled !== false,
        ...data
      },
      ...data
    };
  }
}
