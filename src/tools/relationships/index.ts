import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { createLogger } from "../../utils/logger";
import { GetRelationshipsTool } from "./get_relationships";

const logger = createLogger("RelationshipTools");

/**
 * Register all relationship management tools with the registry
 * @param client Quickbase client
 */
export function registerRelationshipTools(client: QuickbaseClient): void {
  logger.info("Registering relationship management tools");

  // Register get_relationships tool (RELS.1002)
  toolRegistry.registerTool(new GetRelationshipsTool(client));

  // Future tools to be registered:
  // - CreateRelationshipTool (RELS.1003)
  // - UpdateRelationshipTool (RELS.1004)
  // - DeleteRelationshipTool (RELS.1005)

  logger.info("Relationship management tools registered");
}

// Export relationship tools
export { GetRelationshipsTool } from "./get_relationships";
export type {
  GetRelationshipsParams,
  GetRelationshipsResult,
  Relationship,
  RelationshipFieldInfo,
} from "./get_relationships";

// Future exports for relationship tools
// export { CreateRelationshipTool } from './create_relationship';
// export { UpdateRelationshipTool } from './update_relationship';
// export { DeleteRelationshipTool } from './delete_relationship';
