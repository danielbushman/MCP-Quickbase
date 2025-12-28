import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("CreateTableTool");

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
  public description =
    "Creates a new table in a Quickbase application. IMPORTANT: This only creates the table structure with system fields. To add custom fields, use the create_field tool after creating the table.";

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

    const { app_id, name, description, options } = params;

    // Prepare request body
    const body: Record<string, any> = {
      name,
      description: description || "",
    };

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
