import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CreateFieldTool } from './create_field';
import { GetFieldTool } from './get_field';
import { UpdateFieldTool } from './update_field';
import { DeleteFieldsTool } from './delete_fields';
import { GetFieldUsageTool } from './get_field_usage';
import { GetFieldsUsageTool } from './get_fields_usage';
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
  toolRegistry.registerTool(new GetFieldTool(client));
  toolRegistry.registerTool(new UpdateFieldTool(client));
  toolRegistry.registerTool(new DeleteFieldsTool(client));
  toolRegistry.registerTool(new GetFieldUsageTool(client));
  toolRegistry.registerTool(new GetFieldsUsageTool(client));

  logger.info('Field management tools registered');
}

// Export all tools
export * from './create_field';
export * from './get_field';
export * from './update_field';
export * from './delete_fields';
export * from './get_field_usage';
export * from './get_fields_usage';