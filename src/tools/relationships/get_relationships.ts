import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("GetRelationshipsTool");

/**
 * Field information in a relationship
 */
export interface RelationshipFieldInfo {
  /**
   * The ID of the field
   */
  id: number;

  /**
   * The label (display name) of the field
   */
  label: string;

  /**
   * The type of the field
   */
  type: string;
}

/**
 * Relationship between two tables
 */
export interface Relationship {
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
   * Whether this is a cross-app relationship
   */
  isCrossApp: boolean;

  /**
   * Lookup fields in the child table that pull data from the parent
   */
  lookupFields: RelationshipFieldInfo[];

  /**
   * Summary fields in the parent table that aggregate data from the child
   */
  summaryFields: RelationshipFieldInfo[];
}

/**
 * Parameters for get_relationships tool
 */
export interface GetRelationshipsParams {
  /**
   * The ID of the table to get relationships for
   */
  table_id: string;

  /**
   * Number of relationships to skip (for pagination)
   */
  skip?: number;
}

/**
 * Response from getting relationships
 */
export interface GetRelationshipsResult {
  /**
   * Array of relationships
   */
  relationships: Relationship[];

  /**
   * Metadata about the response
   */
  metadata: {
    /**
     * Total number of relationships for the table
     */
    totalRelationships: number;

    /**
     * Number of relationships returned in this response
     */
    numRelationships: number;

    /**
     * Number of relationships skipped
     */
    skip: number;
  };
}

/**
 * Tool for retrieving all table-to-table relationships for a specified table
 */
export class GetRelationshipsTool extends BaseTool<
  GetRelationshipsParams,
  GetRelationshipsResult
> {
  public name = "get_relationships";
  public description =
    "Gets all table-to-table relationships for a specified table. Returns both relationships " +
    "where this table is the child (has reference fields pointing to parents) and where this " +
    "table is the parent (has child tables referencing it). Use this tool to explore table " +
    "structure and understand data connections before modifying relationships.";

  /**
   * Parameter schema for get_relationships
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "The ID of the Quickbase table (DBID)",
      },
      skip: {
        type: "number",
        description:
          "Number of relationships to skip for pagination (default: 0)",
      },
    },
    required: ["table_id"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the get_relationships tool
   * @param params Tool parameters
   * @returns Relationships for the table
   */
  protected async run(
    params: GetRelationshipsParams,
  ): Promise<GetRelationshipsResult> {
    const { table_id, skip = 0 } = params;

    logger.info("Getting relationships for table", { tableId: table_id, skip });

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (skip > 0) {
      queryParams.skip = skip.toString();
    }

    // Get relationships for the table
    const response = await this.client.request<Record<string, unknown>>({
      method: "GET",
      path: `/tables/${table_id}/relationships`,
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to get relationships", {
        error: response.error,
        tableId: table_id,
      });
      throw new Error(response.error?.message || "Failed to get relationships");
    }

    // Parse and validate the API response
    const data = response.data;

    // Validate relationships array exists
    const rawRelationships = data.relationships;
    if (!Array.isArray(rawRelationships)) {
      logger.error("Relationships response missing relationships array", {
        data,
      });
      throw new Error(
        "Relationships response does not contain relationships array",
      );
    }

    // Transform API response to our interface
    const relationships: Relationship[] = rawRelationships.map(
      (rel: Record<string, unknown>) => {
        const foreignKeyField = rel.foreignKeyField as
          | Record<string, unknown>
          | undefined;
        const lookupFields = rel.lookupFields as
          | Record<string, unknown>[]
          | undefined;
        const summaryFields = rel.summaryFields as
          | Record<string, unknown>[]
          | undefined;

        return {
          id: rel.id as number,
          parentTableId: rel.parentTableId as string,
          childTableId: rel.childTableId as string,
          foreignKeyField: foreignKeyField
            ? {
                id: foreignKeyField.id as number,
                label: foreignKeyField.label as string,
                type: foreignKeyField.type as string,
              }
            : { id: 0, label: "", type: "" },
          isCrossApp: (rel.isCrossApp as boolean) || false,
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
      },
    );

    // Extract metadata from response
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const totalRelationships =
      (metadata?.totalRelationships as number) ?? relationships.length;
    const numRelationships =
      (metadata?.numRelationships as number) ?? relationships.length;

    logger.info(`Found ${relationships.length} relationships for table`, {
      tableId: table_id,
      totalRelationships,
      numRelationships,
      skip,
    });

    return {
      relationships,
      metadata: {
        totalRelationships,
        numRelationships,
        skip,
      },
    };
  }
}
