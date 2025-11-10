import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CreateWebhookTool');

/**
 * Parameters for create_webhook tool
 */
export interface CreateWebhookParams {
  /**
   * Table ID to create webhook for
   */
  table_id: string;

  /**
   * Webhook endpoint URL
   */
  endpoint_url: string;

  /**
   * Event types to trigger webhook (e.g., 'RecordCreated', 'RecordModified', 'RecordDeleted')
   */
  event_types: string[];

  /**
   * Optional webhook name/description
   */
  name?: string;

  /**
   * Whether webhook is enabled (default: true)
   */
  enabled?: boolean;

  /**
   * Additional headers to include in webhook requests
   */
  headers?: Record<string, string>;

  /**
   * Filter criteria for webhook triggers
   */
  filter?: string;
}

/**
 * Response from creating a webhook
 */
export interface CreateWebhookResult {
  /**
   * Webhook ID
   */
  webhookId: string;

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
   * Creation timestamp
   */
  created?: string;

  /**
   * Additional webhook details
   */
  [key: string]: any;
}

/**
 * Tool for creating event-driven webhooks in Quickbase
 * Enables real-time notifications when table events occur
 */
export class CreateWebhookTool extends BaseTool<CreateWebhookParams, CreateWebhookResult> {
  public name = 'create_webhook';
  public description = 'Create an event-driven webhook for a Quickbase table. Webhooks trigger HTTP requests to your endpoint when specified events occur (record created, modified, or deleted).';

  /**
   * Parameter schema for create_webhook
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'Table ID to create webhook for'
      },
      endpoint_url: {
        type: 'string',
        description: 'Webhook endpoint URL (must be HTTPS)'
      },
      event_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Event types to trigger webhook (RecordCreated, RecordModified, RecordDeleted)'
      },
      name: {
        type: 'string',
        description: 'Optional webhook name/description'
      },
      enabled: {
        type: 'boolean',
        description: 'Whether webhook is enabled (default: true)'
      },
      headers: {
        type: 'object',
        description: 'Additional headers to include in webhook requests'
      },
      filter: {
        type: 'string',
        description: 'Filter criteria for webhook triggers (Quickbase query format)'
      }
    },
    required: ['table_id', 'endpoint_url', 'event_types']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the create_webhook tool
   * @param params Tool parameters
   * @returns Created webhook details
   */
  protected async run(params: CreateWebhookParams): Promise<CreateWebhookResult> {
    logger.info('Creating webhook', {
      tableId: params.table_id,
      endpointUrl: params.endpoint_url,
      eventTypes: params.event_types
    });

    const { table_id, endpoint_url, event_types, name, enabled, headers, filter } = params;

    // Prepare request body
    const body: Record<string, any> = {
      tableId: table_id,
      endpointUrl: endpoint_url,
      eventTypes: event_types,
      enabled: enabled !== false
    };

    if (name) body.name = name;
    if (headers) body.headers = headers;
    if (filter) body.filter = filter;

    // Create the webhook
    const response = await this.client.request({
      method: 'POST',
      path: '/webhooks',
      body
    });

    if (!response.success || !response.data) {
      logger.error('Failed to create webhook', {
        error: response.error,
        params
      });
      throw new Error(response.error?.message || 'Failed to create webhook');
    }

    const webhook = response.data as Record<string, any>;

    logger.info('Successfully created webhook', {
      webhookId: webhook.id || webhook.webhookId,
      tableId: table_id
    });

    return {
      webhookId: webhook.id || webhook.webhookId,
      tableId: table_id,
      endpointUrl: endpoint_url,
      eventTypes: event_types,
      enabled: webhook.enabled !== false,
      created: webhook.created || webhook.createdDate,
      ...webhook
    };
  }
}
