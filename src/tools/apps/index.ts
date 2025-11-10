import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CreateAppTool } from './create_app';
import { UpdateAppTool } from './update_app';
import { GetAppTool } from './get_app';
import { DeleteAppTool } from './delete_app';
import { ListTablesTool } from './list_tables';
import { ListAppsTool } from './list_apps';
import { CopyAppTool } from './copy_app';
import { GetAppEventsTool } from './get_app_events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AppTools');

/**
 * Register all app management tools with the registry
 * @param client Quickbase client
 */
export function registerAppTools(client: QuickbaseClient): void {
  logger.info('Registering app management tools');

  // Register individual tools
  toolRegistry.registerTool(new CreateAppTool(client));
  toolRegistry.registerTool(new GetAppTool(client));
  toolRegistry.registerTool(new UpdateAppTool(client));
  toolRegistry.registerTool(new DeleteAppTool(client));
  toolRegistry.registerTool(new ListAppsTool(client));
  toolRegistry.registerTool(new ListTablesTool(client));
  toolRegistry.registerTool(new CopyAppTool(client));
  toolRegistry.registerTool(new GetAppEventsTool(client));

  logger.info('App management tools registered');
}

// Export all tools
export * from './create_app';
export * from './get_app';
export * from './update_app';
export * from './delete_app';
export * from './list_apps';
export * from './list_tables';
export * from './copy_app';
export * from './get_app_events';