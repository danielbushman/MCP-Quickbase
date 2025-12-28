import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { CreateTableTool } from "./create_table";
import { UpdateTableTool } from "./update_table";
import { GetTableFieldsTool } from "./get_table_fields";
import { createLogger } from "../../utils/logger";

const logger = createLogger("TableTools");

/**
 * Register all table operation tools with the registry
 * @param client Quickbase client
 */
export function registerTableTools(client: QuickbaseClient): void {
  logger.info("Registering table operation tools");

  // Register individual tools
  toolRegistry.registerTool(new CreateTableTool(client));
  toolRegistry.registerTool(new UpdateTableTool(client));
  toolRegistry.registerTool(new GetTableFieldsTool(client));

  logger.info("Table operation tools registered");
}

// Export all tools
export * from "./create_table";
export * from "./update_table";
export * from "./get_table_fields";
