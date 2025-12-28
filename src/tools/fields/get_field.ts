import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("GetFieldTool");

/**
 * Parameters for get_field tool
 */
export interface GetFieldParams {
  /**
   * The ID of the table containing the field
   */
  table_id: string;

  /**
   * The ID of the field to retrieve
   */
  field_id: string;
}

/**
 * Response from getting a field
 */
export interface GetFieldResult {
  /**
   * The ID of the field
   */
  fieldId: string;

  /**
   * The label (display name) of the field
   */
  label: string;

  /**
   * The type of the field
   */
  fieldType: string;

  /**
   * The description of the field
   */
  description?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is unique
   */
  unique?: boolean;

  /**
   * Additional properties of the field
   */
  properties?: Record<string, any>;

  /**
   * The ID of the table containing the field
   */
  tableId: string;

  /**
   * Additional details about the field
   */
  [key: string]: any;
}

/**
 * Tool for retrieving detailed information about a single field by ID
 */
export class GetFieldTool extends BaseTool<GetFieldParams, GetFieldResult> {
  public name = "get_field";
  public description =
    "Retrieves detailed information about a single field in a Quickbase table by its field ID";

  /**
   * Parameter schema for get_field
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
        description: "The ID of the field to retrieve",
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
   * Run the get_field tool
   * @param params Tool parameters
   * @returns Field information
   */
  protected async run(params: GetFieldParams): Promise<GetFieldResult> {
    const { table_id, field_id } = params;

    logger.info("Retrieving field from Quickbase table", {
      tableId: table_id,
      fieldId: field_id,
    });

    // Get the field
    const response = await this.client.request({
      method: "GET",
      path: `/fields/${field_id}?tableId=${table_id}`,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to retrieve field", {
        error: response.error,
        tableId: table_id,
        fieldId: field_id,
      });
      throw new Error(response.error?.message || "Failed to retrieve field");
    }

    const field = response.data as Record<string, any>;

    logger.info("Successfully retrieved field", {
      fieldId: field.id,
      tableId: table_id,
      label: field.label,
      fieldType: field.fieldType,
    });

    return {
      fieldId: field.id,
      label: field.label,
      fieldType: field.fieldType,
      description: field.description,
      required: field.required,
      unique: field.unique,
      properties: field.properties,
      tableId: table_id,
      ...field,
    };
  }
}
