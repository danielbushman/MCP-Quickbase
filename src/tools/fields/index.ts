import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { CreateFieldTool } from "./create_field";
import { GetFieldTool } from "./get_field";
import { UpdateFieldTool } from "./update_field";
import { DeleteFieldTool } from "./delete_field";
import { createLogger } from "../../utils/logger";

const logger = createLogger("FieldTools");

/**
 * Register all field management tools with the registry
 * @param client Quickbase client
 */
export function registerFieldTools(client: QuickbaseClient): void {
  logger.info("Registering field management tools");

  // Register individual tools (Create, Get, Update, Delete order)
  toolRegistry.registerTool(new CreateFieldTool(client));
  toolRegistry.registerTool(new GetFieldTool(client));
  toolRegistry.registerTool(new UpdateFieldTool(client));
  toolRegistry.registerTool(new DeleteFieldTool(client));

  logger.info("Field management tools registered");
}

// Export all tools (Create, Get, Update, Delete order)
export * from "./create_field";
export * from "./get_field";
export * from "./update_field";
export * from "./delete_field";
