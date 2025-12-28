import { QuickbaseClient } from "../client/quickbase";
import { CacheService } from "../utils/cache";
import { toolRegistry } from "./registry";
import { TestConnectionTool } from "./test_connection";
import { ConfigureCacheTool } from "./configure_cache";
import { registerAppTools } from "./apps";
import { registerTableTools } from "./tables";
import { registerFieldTools } from "./fields";
import { registerRecordTools } from "./records";
import { registerFileTools } from "./files";
import { registerReportTools } from "./reports";
import { registerRelationshipTools } from "./relationships";
import { createLogger } from "../utils/logger";

const logger = createLogger("ToolsInit");

/**
 * Initialize all MCP tools and register them with the registry
 * @param client Quickbase client
 * @param cacheService Cache service
 */
export function initializeTools(
  client: QuickbaseClient,
  cacheService: CacheService,
): void {
  logger.info("Initializing MCP tools");

  // Register connection tools
  toolRegistry.registerTool(new TestConnectionTool(client));
  toolRegistry.registerTool(new ConfigureCacheTool(client, cacheService));

  // Register app management tools
  registerAppTools(client);

  // Register table operation tools
  registerTableTools(client);

  // Register field management tools
  registerFieldTools(client);

  // Register record operation tools
  registerRecordTools(client);

  // Register file operation tools
  registerFileTools(client);

  // Register report operation tools
  registerReportTools(client);

  // Register relationship management tools
  registerRelationshipTools(client);

  logger.info(`Registered ${toolRegistry.getToolCount()} tools`);
}

// Export all tools and related types
export * from "./registry";
export * from "./base";
export * from "./test_connection";
export * from "./configure_cache";
export * from "./apps";
export * from "./tables";
export * from "./fields";
export * from "./records";
export * from "./files";
export * from "./reports";
export * from "./relationships";
