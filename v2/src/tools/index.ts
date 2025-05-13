import { QuickbaseClient } from '../client/quickbase';
import { CacheService } from '../utils/cache';
import { toolRegistry } from './registry';
import { TestConnectionTool } from './test_connection';
import { ConfigureCacheTool } from './configure_cache';
import { registerAppTools } from './apps';
import { registerTableTools } from './tables';
import { registerFieldTools } from './fields';
import { createLogger } from '../utils/logger';

const logger = createLogger('ToolsInit');

/**
 * Initialize all MCP tools and register them with the registry
 * @param client Quickbase client
 * @param cacheService Cache service
 */
export function initializeTools(
  client: QuickbaseClient,
  cacheService: CacheService
): void {
  logger.info('Initializing MCP tools');
  
  // Register connection tools
  toolRegistry.registerTool(new TestConnectionTool(client));
  toolRegistry.registerTool(new ConfigureCacheTool(client, cacheService));
  
  // Register app management tools
  registerAppTools(client);
  
  // Register table operation tools
  registerTableTools(client);
  
  // Register field management tools
  registerFieldTools(client);
  
  // Additional tools will be registered here
  
  logger.info(`Registered ${toolRegistry.getToolCount()} tools`);
}

// Export all tools and related types
export * from './registry';
export * from './base';
export * from './test_connection';
export * from './configure_cache';
export * from './apps';
export * from './tables';
export * from './fields';