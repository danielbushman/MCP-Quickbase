import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("DeleteRelationshipTool");

/**
 * Parameters for delete_relationship tool
 */
export interface DeleteRelationshipParams {
  /**
   * The ID of the child table (DBID) containing the relationship
   */
  table_id: string;

  /**
   * The ID of the relationship to delete
   */
  relationship_id: number;
}

/**
 * Result from deleting a relationship
 */
export interface DeleteRelationshipResult {
  /**
   * The ID of the deleted relationship
   */
  relationshipId: number;

  /**
   * Whether the deletion was successful
   */
  deleted: boolean;
}

/**
 * Tool for deleting a table-to-table relationship in Quickbase.
 *
 * WARNING: This is a DESTRUCTIVE operation that permanently deletes
 * the relationship and all associated lookup and summary fields.
 */
export class DeleteRelationshipTool extends BaseTool<
  DeleteRelationshipParams,
  DeleteRelationshipResult
> {
  public name = "delete_relationship";
  public description =
    "WARNING: DESTRUCTIVE OPERATION - Permanently deletes an entire table-to-table " +
    "relationship INCLUDING ALL LOOKUP AND SUMMARY FIELDS associated with it. All data " +
    "in those fields will be permanently lost and CANNOT be recovered. The reference " +
    "field in the child table will NOT be deleted (it will remain and may need to be " +
    "manually deleted using field deletion tools if no longer needed). Before using " +
    "this tool:\n" +
    "1. Use get_relationships to see what fields will be deleted\n" +
    "2. Confirm with the user that they want to proceed\n" +
    "3. Consider if you only need to delete specific fields instead\n\n" +
    "Only use this tool when you are certain the entire relationship should be removed.";

  /**
   * Parameter schema for delete_relationship
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description:
          "The ID of the child Quickbase table (DBID) containing the relationship",
      },
      relationship_id: {
        type: "number",
        description: "The ID of the relationship to delete",
      },
    },
    required: ["table_id", "relationship_id"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_relationship tool
   * @param params Tool parameters
   * @returns Deletion confirmation
   */
  protected async run(
    params: DeleteRelationshipParams,
  ): Promise<DeleteRelationshipResult> {
    const { table_id, relationship_id } = params;

    // Use logger.warn for destructive operations
    logger.warn("Deleting relationship", {
      tableId: table_id,
      relationshipId: relationship_id,
    });

    // Delete the relationship
    const response = await this.client.request<Record<string, unknown>>({
      method: "DELETE",
      path: `/tables/${table_id}/relationships/${relationship_id}`,
    });

    if (!response.success) {
      logger.error("Failed to delete relationship", {
        error: response.error,
        tableId: table_id,
        relationshipId: relationship_id,
      });
      throw new Error(
        response.error?.message || "Failed to delete relationship",
      );
    }

    logger.warn("Successfully deleted relationship", {
      tableId: table_id,
      relationshipId: relationship_id,
    });

    return {
      relationshipId: relationship_id,
      deleted: true,
    };
  }
}
