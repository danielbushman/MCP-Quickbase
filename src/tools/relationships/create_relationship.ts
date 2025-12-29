import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";
import { RelationshipFieldInfo } from "./get_relationships";

const logger = createLogger("CreateRelationshipTool");

/**
 * Valid accumulation types for summary fields
 */
export type SummaryAccumulationType = "SUM" | "COUNT" | "AVG" | "MAX" | "MIN";

/**
 * Parameters for create_relationship tool
 */
export interface CreateRelationshipParams {
  /**
   * The ID of the child table (DBID) where the relationship reference field will be created
   */
  table_id: string;

  /**
   * The ID of the parent table (DBID) to link to
   */
  parent_table_id: string;

  /**
   * Optional label for the foreign key reference field created in the child table
   */
  foreign_key_label?: string;

  /**
   * Optional array of parent field IDs to create as lookup fields in the child table
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
 * Result from creating a relationship
 */
export interface CreateRelationshipResult {
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
   * The foreign key field created in the child table
   */
  foreignKeyField: RelationshipFieldInfo;

  /**
   * Lookup fields created in the child table
   */
  lookupFields: RelationshipFieldInfo[];

  /**
   * Summary fields created in the parent table
   */
  summaryFields: RelationshipFieldInfo[];
}

/**
 * Tool for creating a new table-to-table relationship in Quickbase.
 *
 * Creates a reference field in the child table linking to the parent table.
 * Optionally creates lookup fields and/or summary fields.
 */
export class CreateRelationshipTool extends BaseTool<
  CreateRelationshipParams,
  CreateRelationshipResult
> {
  public name = "create_relationship";
  public description =
    "Creates a new table-to-table relationship linking a child table to a parent table. " +
    "This creates a reference field in the child table. Optionally creates lookup fields " +
    "(to display parent data in child records) and/or a summary field (to aggregate child " +
    "data in parent records). Relationships can only be created between tables in the same " +
    "application. This operation is SAFE and does not modify existing data.";

  /**
   * Parameter schema for create_relationship with conditional validation
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description:
          "The ID of the child Quickbase table (DBID) where the relationship reference field will be created",
      },
      parent_table_id: {
        type: "string",
        description: "The ID of the parent Quickbase table (DBID) to link to",
      },
      foreign_key_label: {
        type: "string",
        description:
          "Optional label for the foreign key reference field created in the child table",
      },
      lookup_field_ids: {
        type: "array",
        items: {
          type: "number",
        },
        description:
          "Optional array of parent field IDs to create as lookup fields in the child table",
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
    required: ["table_id", "parent_table_id"],
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
   * Run the create_relationship tool
   * @param params Tool parameters
   * @returns Created relationship details
   */
  protected async run(
    params: CreateRelationshipParams,
  ): Promise<CreateRelationshipResult> {
    const {
      table_id,
      parent_table_id,
      foreign_key_label,
      lookup_field_ids,
      summary_field_id,
      summary_label,
      summary_accumulation_type,
      summary_where,
    } = params;

    logger.info("Creating relationship between tables", {
      childTableId: table_id,
      parentTableId: parent_table_id,
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
    const body: Record<string, unknown> = {
      parentTableId: parent_table_id,
    };

    // Add optional foreign key label
    if (foreign_key_label) {
      body.foreignKeyField = {
        label: foreign_key_label,
      };
    }

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

    // Create the relationship
    const response = await this.client.request<Record<string, unknown>>({
      method: "POST",
      path: `/tables/${table_id}/relationship`,
      body,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to create relationship", {
        error: response.error,
        childTableId: table_id,
        parentTableId: parent_table_id,
      });
      throw new Error(
        response.error?.message || "Failed to create relationship",
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

    const result: CreateRelationshipResult = {
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

    logger.info("Successfully created relationship", {
      relationshipId: result.id,
      childTableId: result.childTableId,
      parentTableId: result.parentTableId,
      lookupFieldsCreated: result.lookupFields.length,
      summaryFieldsCreated: result.summaryFields.length,
    });

    return result;
  }
}
