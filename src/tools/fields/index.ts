import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CreateFieldTool } from './create_field';
import { UpdateFieldTool } from './update_field';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FieldTools');

/**
 * Register all field management tools with the registry
 * @param client Quickbase client
 */
export function registerFieldTools(client: QuickbaseClient): void {
  logger.info('Registering field management tools');
  
  // Register individual tools
  toolRegistry.registerTool(new CreateFieldTool(client));
  toolRegistry.registerTool(new UpdateFieldTool(client));
  
  logger.info('Field management tools registered');
}

// Export all tools
export * from './create_field';
export * from './update_field';