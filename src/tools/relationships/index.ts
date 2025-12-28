import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { createLogger } from "../../utils/logger";
import { GetRelationshipsTool } from "./get_relationships";
import { CreateRelationshipTool } from "./create_relationship";
import { UpdateRelationshipTool } from "./update_relationship";
import { DeleteRelationshipTool } from "./delete_relationship";

const logger = createLogger("RelationshipTools");

/**
 * Register all relationship management tools with the registry
 * @param client Quickbase client
 */
export function registerRelationshipTools(client: QuickbaseClient): void {
  logger.info("Registering relationship management tools");

  // Register get_relationships tool (RELS.1002)
  toolRegistry.registerTool(new GetRelationshipsTool(client));

  // Register create_relationship tool (RELS.2001)
  toolRegistry.registerTool(new CreateRelationshipTool(client));

  // Register update_relationship tool (RELS.2002)
  toolRegistry.registerTool(new UpdateRelationshipTool(client));

  // Register delete_relationship tool (RELS.3001)
  toolRegistry.registerTool(new DeleteRelationshipTool(client));

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

export { CreateRelationshipTool } from "./create_relationship";
export type {
  CreateRelationshipParams,
  CreateRelationshipResult,
  SummaryAccumulationType,
} from "./create_relationship";

export { UpdateRelationshipTool } from "./update_relationship";
export type {
  UpdateRelationshipParams,
  UpdateRelationshipResult,
} from "./update_relationship";

export { DeleteRelationshipTool } from "./delete_relationship";
export type {
  DeleteRelationshipParams,
  DeleteRelationshipResult,
} from "./delete_relationship";
