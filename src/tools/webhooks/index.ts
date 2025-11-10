import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CreateWebhookTool } from './create_webhook';
import { ListWebhooksTool } from './list_webhooks';
import { GetWebhookTool } from './get_webhook';
import { UpdateWebhookTool } from './update_webhook';
import { DeleteWebhookTool } from './delete_webhook';
import { createLogger } from '../../utils/logger';

const logger = createLogger('WebhookTools');

/**
 * Register all webhook management tools with the registry
 * @param client Quickbase client
 */
export function registerWebhookTools(client: QuickbaseClient): void {
  logger.info('Registering webhook management tools');

  // Register individual tools
  toolRegistry.registerTool(new CreateWebhookTool(client));
  toolRegistry.registerTool(new ListWebhooksTool(client));
  toolRegistry.registerTool(new GetWebhookTool(client));
  toolRegistry.registerTool(new UpdateWebhookTool(client));
  toolRegistry.registerTool(new DeleteWebhookTool(client));

  logger.info('Webhook management tools registered');
}

// Export all tools
export * from './create_webhook';
export * from './list_webhooks';
export * from './get_webhook';
export * from './update_webhook';
export * from './delete_webhook';
