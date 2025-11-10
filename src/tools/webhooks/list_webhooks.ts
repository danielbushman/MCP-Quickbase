import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListWebhooksTool');

/**
 * Parameters for list_webhooks tool
 */
export interface ListWebhooksParams {
  /**
   * Optional table ID to filter webhooks by table
   */
  table_id?: string;

  /**
   * Optional filter by enabled status
   */
  enabled?: boolean;
}

/**
 * Webhook summary information
 */
export interface WebhookSummary {
  /**
   * Webhook ID
   */
  id: string;

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
   * Creation date
   */
  created?: string;
}

/**
 * Response from listing webhooks
 */
export interface ListWebhooksResult {
  /**
   * Array of webhooks
   */
  webhooks: WebhookSummary[];

  /**
   * Total number of webhooks
   */
  total: number;

  /**
   * Additional metadata
   */
  [key: string]: any;
}

/**
 * Tool for listing all webhooks in Quickbase
 * Can filter by table or enabled status
 */
export class ListWebhooksTool extends BaseTool<ListWebhooksParams, ListWebhooksResult> {
  public name = 'list_webhooks';
  public description = 'List all webhooks in Quickbase. Optionally filter by table ID or enabled status.';

  /**
   * Parameter schema for list_webhooks
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'Optional table ID to filter webhooks by table'
      },
      enabled: {
        type: 'boolean',
        description: 'Optional filter by enabled status'
      }
    }
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the list_webhooks tool
   * @param params Tool parameters
   * @returns List of webhooks
   */
  protected async run(params: ListWebhooksParams): Promise<ListWebhooksResult> {
    logger.info('Listing webhooks', {
      tableId: params.table_id,
      enabled: params.enabled
    });

    const { table_id, enabled } = params;

    // Build query parameters
    const queryParams: Record<string, string> = {};
    if (table_id) queryParams.tableId = table_id;
    if (enabled !== undefined) queryParams.enabled = String(enabled);

    // List webhooks
    const response = await this.client.request({
      method: 'GET',
      path: '/webhooks',
      params: queryParams
    });

    if (!response.success || !response.data) {
      logger.error('Failed to list webhooks', {
        error: response.error
      });
      throw new Error(response.error?.message || 'Failed to list webhooks');
    }

    const data = response.data as Record<string, any>;
    const webhooks = data.webhooks || data.data || [];

    logger.info('Successfully listed webhooks', {
      count: webhooks.length
    });

    return {
      webhooks: webhooks.map((webhook: any) => ({
        id: webhook.id || webhook.webhookId,
        name: webhook.name,
        tableId: webhook.tableId,
        endpointUrl: webhook.endpointUrl || webhook.url,
        eventTypes: webhook.eventTypes || [],
        enabled: webhook.enabled !== false,
        created: webhook.created || webhook.createdDate
      })),
      total: webhooks.length,
      ...data
    };
  }
}
