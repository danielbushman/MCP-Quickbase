import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { CreateAppTool } from "./create_app";
import { UpdateAppTool } from "./update_app";
import { ListTablesTool } from "./list_tables";
import { createLogger } from "../../utils/logger";

const logger = createLogger("AppTools");

/**
 * Register all app management tools with the registry
 * @param client Quickbase client
 */
export function registerAppTools(client: QuickbaseClient): void {
  logger.info("Registering app management tools");

  // Register individual tools
  toolRegistry.registerTool(new CreateAppTool(client));
  toolRegistry.registerTool(new UpdateAppTool(client));
  toolRegistry.registerTool(new ListTablesTool(client));

  logger.info("App management tools registered");
}

// Export all tools
export * from "./create_app";
export * from "./update_app";
export * from "./list_tables";
