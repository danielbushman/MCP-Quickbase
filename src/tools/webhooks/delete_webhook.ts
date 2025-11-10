import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeleteWebhookTool');

/**
 * Parameters for delete_webhook tool
 */
export interface DeleteWebhookParams {
  /**
   * Webhook ID to delete
   */
  webhook_id: string;
}

/**
 * Response from deleting a webhook
 */
export interface DeleteWebhookResult {
  /**
   * Whether deletion was successful
   */
  success: boolean;

  /**
   * Webhook ID that was deleted
   */
  webhookId: string;

  /**
   * Confirmation message
   */
  message: string;
}

/**
 * Tool for deleting a webhook
 * Permanently removes the webhook configuration
 */
export class DeleteWebhookTool extends BaseTool<DeleteWebhookParams, DeleteWebhookResult> {
  public name = 'delete_webhook';
  public description = 'Delete a webhook permanently. This action cannot be undone. The webhook will stop triggering immediately.';

  /**
   * Parameter schema for delete_webhook
   */
  public paramSchema = {
    type: 'object',
    properties: {
      webhook_id: {
        type: 'string',
        description: 'Webhook ID to delete'
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
   * Run the delete_webhook tool
   * @param params Tool parameters
   * @returns Deletion confirmation
   */
  protected async run(params: DeleteWebhookParams): Promise<DeleteWebhookResult> {
    logger.info('Deleting webhook', {
      webhookId: params.webhook_id
    });

    const { webhook_id } = params;

    // Delete the webhook
    const response = await this.client.request({
      method: 'DELETE',
      path: `/webhooks/${webhook_id}`
    });

    if (!response.success) {
      logger.error('Failed to delete webhook', {
        error: response.error,
        webhookId: webhook_id
      });
      throw new Error(response.error?.message || 'Failed to delete webhook');
    }

    logger.info('Successfully deleted webhook', {
      webhookId: webhook_id
    });

    return {
      success: true,
      webhookId: webhook_id,
      message: 'Webhook deleted successfully'
    };
  }
}
