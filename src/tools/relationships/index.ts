/**
 * Relationship tools for Quickbase MCP
 */

import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CreateRelationshipTool } from './create_relationship';
import { ListRelationshipsTool } from './list_relationships';
import { UpdateRelationshipTool } from './update_relationship';
import { DeleteRelationshipTool } from './delete_relationship';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RelationshipTools');

/**
 * Register all relationship management tools with the registry
 * @param client Quickbase client
 */
export function registerRelationshipTools(client: QuickbaseClient): void {
  logger.info('Registering relationship management tools');

  // Register individual tools
  toolRegistry.registerTool(new CreateRelationshipTool(client));
  toolRegistry.registerTool(new ListRelationshipsTool(client));
  toolRegistry.registerTool(new UpdateRelationshipTool(client));
  toolRegistry.registerTool(new DeleteRelationshipTool(client));

  logger.info('Relationship management tools registered');
}

// Export all tools
export * from './create_relationship';
export * from './list_relationships';
export * from './update_relationship';
export * from './delete_relationship';
