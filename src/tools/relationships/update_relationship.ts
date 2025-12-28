import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";
import { RelationshipFieldInfo } from "./get_relationships";
import { SummaryAccumulationType } from "./create_relationship";

const logger = createLogger("UpdateRelationshipTool");

/**
 * Parameters for update_relationship tool
 */
export interface UpdateRelationshipParams {
  /**
   * The ID of the child table (DBID) containing the relationship
   */
  table_id: string;

  /**
   * The ID of the relationship (same as the foreign key field ID)
   */
  relationship_id: number;

  /**
   * Optional array of parent field IDs to add as lookup fields in the child table
   */
  lookup_field_ids?: number[];

  /**
   * Optional child field ID to summarize in the parent table
   */
  summary_field_id?: number;

  /**
   * Optional label for the summary field created in the parent table
   */
  summary_label?: string;

  /**
   * Accumulation type for the summary field (required if summary_field_id is provided)
   */
  summary_accumulation_type?: SummaryAccumulationType;

  /**
   * Optional Quickbase query filter for the summary field
   */
  summary_where?: string;
}

/**
 * Result from updating a relationship
 */
export interface UpdateRelationshipResult {
  /**
   * The ID of the relationship (same as the foreign key field ID)
   */
  id: number;

  /**
   * The ID of the parent table
   */
  parentTableId: string;

  /**
   * The ID of the child table
   */
  childTableId: string;

  /**
   * The foreign key field in the child table
   */
  foreignKeyField: RelationshipFieldInfo;

  /**
   * All lookup fields in the child table (existing + newly added)
   */
  lookupFields: RelationshipFieldInfo[];

  /**
   * All summary fields in the parent table (existing + newly added)
   */
  summaryFields: RelationshipFieldInfo[];
}

/**
 * Tool for updating an existing table-to-table relationship in Quickbase.
 *
 * ADDITIVE ONLY - adds lookup fields and/or summary fields to existing relationships.
 * Does not delete existing fields from the relationship.
 */
export class UpdateRelationshipTool extends BaseTool<
  UpdateRelationshipParams,
  UpdateRelationshipResult
> {
  public name = "update_relationship";
  public description =
    "Adds lookup fields and/or summary fields to an existing relationship. This operation " +
    "is ADDITIVE ONLY - it will not delete existing lookup or summary fields. Use this to " +
    "enhance relationships with additional calculated fields. To remove fields from a " +
    "relationship, you must delete them individually using the field deletion tools.";

  /**
   * Parameter schema for update_relationship with conditional validation
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
        description:
          "The ID of the relationship to update (same as the foreign key field ID)",
      },
      lookup_field_ids: {
        type: "array",
        items: {
          type: "number",
        },
        description:
          "Optional array of parent field IDs to add as lookup fields in the child table",
      },
      summary_field_id: {
        type: "number",
        description: "Optional child field ID to summarize in the parent table",
      },
      summary_label: {
        type: "string",
        description:
          "Optional label for the summary field created in the parent table",
      },
      summary_accumulation_type: {
        type: "string",
        enum: ["SUM", "COUNT", "AVG", "MAX", "MIN"],
        description:
          "Accumulation type for the summary field. Required when summary_field_id is provided. " +
          "Valid values: SUM, COUNT, AVG, MAX, MIN",
      },
      summary_where: {
        type: "string",
        description:
          "Optional Quickbase query filter for the summary field (e.g., \"{6.EX.'Active'}\")",
      },
    },
    required: ["table_id", "relationship_id"],
    // Conditional validation: summary_accumulation_type is required when summary_field_id is provided
    if: {
      properties: { summary_field_id: { type: "number" } },
      required: ["summary_field_id"],
    },
    then: {
      required: ["summary_accumulation_type"],
    },
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the update_relationship tool
   * @param params Tool parameters
   * @returns Updated relationship details
   */
  protected async run(
    params: UpdateRelationshipParams,
  ): Promise<UpdateRelationshipResult> {
    const {
      table_id,
      relationship_id,
      lookup_field_ids,
      summary_field_id,
      summary_label,
      summary_accumulation_type,
      summary_where,
    } = params;

    logger.info("Updating relationship", {
      childTableId: table_id,
      relationshipId: relationship_id,
      hasLookupFields: !!lookup_field_ids?.length,
      hasSummaryField: !!summary_field_id,
    });

    // Validate conditional requirement: summary_accumulation_type required when summary_field_id is provided
    if (summary_field_id !== undefined && !summary_accumulation_type) {
      const errorMessage =
        "summary_accumulation_type is required when summary_field_id is provided. " +
        "Valid values: SUM, COUNT, AVG, MAX, MIN";
      logger.error("Validation failed", { error: errorMessage });
      throw new Error(errorMessage);
    }

    // Build the request body according to Quickbase API format
    const body: Record<string, unknown> = {};

    // Add lookup fields if provided
    if (lookup_field_ids && lookup_field_ids.length > 0) {
      body.lookupFieldIds = lookup_field_ids;
    }

    // Add summary field configuration if provided
    if (summary_field_id !== undefined && summary_accumulation_type) {
      const summaryField: Record<string, unknown> = {
        summaryFid: summary_field_id,
        accumulationType: summary_accumulation_type,
      };

      if (summary_label) {
        summaryField.label = summary_label;
      }

      if (summary_where) {
        summaryField.where = summary_where;
      }

      body.summaryFields = [summaryField];
    }

    // Update the relationship
    const response = await this.client.request<Record<string, unknown>>({
      method: "POST",
      path: `/tables/${table_id}/relationships/${relationship_id}`,
      body,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to update relationship", {
        error: response.error,
        childTableId: table_id,
        relationshipId: relationship_id,
      });
      throw new Error(
        response.error?.message || "Failed to update relationship",
      );
    }

    // Parse and transform the API response
    const data = response.data;

    const foreignKeyField = data.foreignKeyField as
      | Record<string, unknown>
      | undefined;
    const lookupFields = data.lookupFields as
      | Record<string, unknown>[]
      | undefined;
    const summaryFields = data.summaryFields as
      | Record<string, unknown>[]
      | undefined;

    const result: UpdateRelationshipResult = {
      id: data.id as number,
      parentTableId: data.parentTableId as string,
      childTableId: data.childTableId as string,
      foreignKeyField: foreignKeyField
        ? {
            id: foreignKeyField.id as number,
            label: foreignKeyField.label as string,
            type: foreignKeyField.type as string,
          }
        : { id: 0, label: "", type: "" },
      lookupFields: (lookupFields || []).map(
        (field: Record<string, unknown>) => ({
          id: field.id as number,
          label: field.label as string,
          type: field.type as string,
        }),
      ),
      summaryFields: (summaryFields || []).map(
        (field: Record<string, unknown>) => ({
          id: field.id as number,
          label: field.label as string,
          type: field.type as string,
        }),
      ),
    };

    logger.info("Successfully updated relationship", {
      relationshipId: result.id,
      childTableId: result.childTableId,
      parentTableId: result.parentTableId,
      totalLookupFields: result.lookupFields.length,
      totalSummaryFields: result.summaryFields.length,
    });

    return result;
  }
}
