import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("CreateTableTool");

/**
 * Field definition for table creation
 */
export interface FieldDefinition {
  /**
   * Name of the field
   */
  name: string;

  /**
   * Type of the field (e.g., text, number, date)
   */
  type: string;

  /**
   * Description of the field
   */
  description?: string;

  /**
   * Additional field properties
   */
  properties?: Record<string, any>;
}

/**
 * Parameters for create_table tool
 */
export interface CreateTableParams {
  /**
   * The ID of the application
   */
  app_id: string;

  /**
   * Name of the table
   */
  name: string;

  /**
   * Description of the table
   */
  description?: string;

  /**
   * Initial fields to create with the table
   */
  fields?: FieldDefinition[];

  /**
   * Additional options for table creation
   */
  options?: Record<string, any>;
}

/**
 * Response from creating a table
 */
export interface CreateTableResult {
  /**
   * The ID of the created table
   */
  tableId: string;

  /**
   * The name of the created table
   */
  name: string;

  /**
   * The description of the created table
   */
  description?: string;

  /**
   * Information about created fields
   */
  fields?: Record<string, any>[];

  /**
   * The date the table was created
   */
  created?: string;

  /**
   * Additional details returned from the API
   */
  [key: string]: any;
}

/**
 * Tool for creating a new table in a Quickbase application
 */
export class CreateTableTool extends BaseTool<
  CreateTableParams,
  CreateTableResult
> {
  public name = "create_table";
  public description = "Creates a new table in a Quickbase application";

  /**
   * Parameter schema for create_table
   */
  public paramSchema = {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description: "The ID of the application",
      },
      name: {
        type: "string",
        description: "Name of the table",
      },
      description: {
        type: "string",
        description: "Description of the table",
      },
      fields: {
        type: "array",
        description: "List of field definitions",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            description: { type: "string" },
            properties: { type: "object" },
          },
          required: ["name", "type"],
        },
      },
      options: {
        type: "object",
        description: "Additional options for table creation",
      },
    },
    required: ["app_id", "name"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the create_table tool
   * @param params Tool parameters
   * @returns Created table details
   */
  protected async run(params: CreateTableParams): Promise<CreateTableResult> {
    logger.info("Creating new table in Quickbase application", {
      appId: params.app_id,
      tableName: params.name,
    });

    const { app_id, name, description, fields, options } = params;

    // Prepare request body
    const body: Record<string, any> = {
      name,
      description: description || "",
    };

    // Add fields if provided
    // Note: The Quickbase REST API may not support inline field creation with POST /tables.
    // Fields may need to be created separately using the create_field tool after table creation.
    if (fields && fields.length > 0) {
      body.fields = fields.map((field) => ({
        fieldType: field.type,
        label: field.name,
        description: field.description || "",
        ...(field.properties || {}),
      }));
    }

    // Add any additional options
    if (options) {
      Object.assign(body, options);
    }

    // Create the table
    const response = await this.client.request({
      method: "POST",
      path: `/tables?appId=${app_id}`,
      body,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to create table", {
        error: response.error,
        appId: app_id,
        tableName: name,
      });
      throw new Error(response.error?.message || "Failed to create table");
    }

    const table = response.data as Record<string, any>;

    logger.info("Successfully created table", {
      tableId: table.id,
      appId: app_id,
      tableName: table.name,
    });

    return {
      tableId: table.id,
      name: table.name,
      description: table.description,
      fields: table.fields,
      created: table.created,
      ...table,
    };
  }
}
