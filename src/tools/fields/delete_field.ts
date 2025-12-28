import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("DeleteFieldTool");

/**
 * System field IDs that cannot be deleted
 * 1 = Record ID
 * 2 = Date Created
 * 3 = Date Modified
 * 4 = Record Owner
 * 5 = Last Modified By
 */
const SYSTEM_FIELD_IDS = ["1", "2", "3", "4", "5"];

/**
 * Parameters for delete_field tool
 */
export interface DeleteFieldParams {
  /**
   * The ID of the table containing the field
   */
  table_id: string;

  /**
   * The ID of the field to delete
   */
  field_id: string;

  /**
   * Optional explicit confirmation for deletion
   */
  confirm_deletion?: boolean;
}

/**
 * Response from deleting a field
 */
export interface DeleteFieldResult {
  /**
   * The ID of the deleted field
   */
  deletedFieldId: string;

  /**
   * The ID of the table the field was deleted from
   */
  tableId: string;

  /**
   * Confirmation message
   */
  message: string;
}

/**
 * Tool for deleting a field from a Quickbase table.
 *
 * WARNING: This operation is destructive and cannot be undone.
 * All data stored in the field will be permanently lost.
 * System fields (IDs 1-5) cannot be deleted.
 */
export class DeleteFieldTool extends BaseTool<
  DeleteFieldParams,
  DeleteFieldResult
> {
  public name = "delete_field";
  public description =
    "Deletes a field from a Quickbase table. WARNING: This operation is destructive and cannot be undone. All data in the field will be permanently lost. System fields (Record ID, Date Created, Date Modified, Record Owner, Last Modified By) cannot be deleted.";

  /**
   * Parameter schema for delete_field
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "The ID of the Quickbase table containing the field",
      },
      field_id: {
        type: "string",
        description: "The ID of the field to delete",
      },
      confirm_deletion: {
        type: "boolean",
        description:
          "Optional explicit confirmation for deletion (recommended for safety)",
      },
    },
    required: ["table_id", "field_id"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the delete_field tool
   * @param params Tool parameters
   * @returns Deletion confirmation
   */
  protected async run(params: DeleteFieldParams): Promise<DeleteFieldResult> {
    const { table_id, field_id } = params;

    logger.info("Attempting to delete field from Quickbase table", {
      tableId: table_id,
      fieldId: field_id,
    });

    // System field protection - reject field IDs 1-5
    if (SYSTEM_FIELD_IDS.includes(field_id)) {
      logger.warn("Attempted to delete system field", {
        tableId: table_id,
        fieldId: field_id,
      });
      throw new Error(
        "Cannot delete system fields (Record ID, Date Created, Date Modified, Record Owner, Last Modified By). Field IDs 1-5 are protected.",
      );
    }

    // Delete the field
    // Quickbase API uses DELETE /fields?tableId=... with fieldIds array in body
    const response = await this.client.request({
      method: "DELETE",
      path: `/fields?tableId=${table_id}`,
      body: {
        fieldIds: [parseInt(field_id, 10)],
      },
    });

    if (!response.success) {
      logger.error("Failed to delete field", {
        error: response.error,
        tableId: table_id,
        fieldId: field_id,
      });
      throw new Error(response.error?.message || "Failed to delete field");
    }

    // Invalidate cache after successful deletion
    this.client.invalidateCache(`fields:${table_id}`);
    this.client.invalidateCache(`field:${table_id}:${field_id}`);

    logger.info("Successfully deleted field", {
      fieldId: field_id,
      tableId: table_id,
    });

    return {
      deletedFieldId: field_id,
      tableId: table_id,
      message: `Field ${field_id} has been successfully deleted from table ${table_id}.`,
    };
  }
}
