import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetAppEventsTool');

/**
 * Parameters for get_app_events tool
 */
export interface GetAppEventsParams {
  /**
   * ID of the application to get events for
   */
  app_id: string;
}

/**
 * Event type information
 */
export interface EventType {
  /**
   * Event type identifier
   */
  type: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Event description
   */
  description?: string;

  /**
   * Table ID if event is table-specific
   */
  tableId?: string;

  /**
   * Whether event supports webhooks
   */
  supportsWebhooks?: boolean;
}

/**
 * Response from getting app events
 */
export interface GetAppEventsResult {
  /**
   * Application ID
   */
  appId: string;

  /**
   * Available event types
   */
  events: EventType[];

  /**
   * Total number of event types
   */
  totalEvents: number;

  /**
   * Additional metadata
   */
  [key: string]: any;
}

/**
 * Tool for listing available event types in a Quickbase application
 * Useful for webhook configuration and event-driven automation
 */
export class GetAppEventsTool extends BaseTool<GetAppEventsParams, GetAppEventsResult> {
  public name = 'get_app_events';
  public description = 'List available event types for a Quickbase application. Useful for webhook configuration and understanding available triggers for automation.';

  /**
   * Parameter schema for get_app_events
   */
  public paramSchema = {
    type: 'object',
    properties: {
      app_id: {
        type: 'string',
        description: 'ID of the application to get events for'
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
   * Run the get_app_events tool
   * @param params Tool parameters
   * @returns Application events information
   */
  protected async run(params: GetAppEventsParams): Promise<GetAppEventsResult> {
    logger.info('Getting application events', {
      appId: params.app_id
    });

    const { app_id } = params;

    // Get application events
    const response = await this.client.request({
      method: 'GET',
      path: `/apps/${app_id}/events`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get application events', {
        error: response.error,
        appId: app_id
      });
      throw new Error(response.error?.message || 'Failed to get application events');
    }

    const data = response.data as Record<string, any>;
    const events = data.events || data.data || [];

    logger.info('Successfully retrieved application events', {
      appId: app_id,
      eventCount: events.length
    });

    return {
      appId: app_id,
      events: events.map((event: any) => ({
        type: event.type || event.eventType,
        name: event.name || event.displayName,
        description: event.description,
        tableId: event.tableId,
        supportsWebhooks: event.supportsWebhooks !== false
      })),
      totalEvents: events.length,
      ...data
    };
  }
}
