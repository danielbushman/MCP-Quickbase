import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ListTablesTool");

/**
 * Table information returned by list_tables
 */
export interface TableInfo {
  /**
   * The ID of the table
   */
  id: string;

  /**
   * The name of the table
   */
  name: string;

  /**
   * The description of the table
   */
  description?: string;

  /**
   * The singular noun for records in this table
   */
  singleRecordName?: string;

  /**
   * The plural noun for records in this table
   */
  pluralRecordName?: string;

  /**
   * The date the table was created
   */
  created?: string;

  /**
   * The date the table was last updated
   */
  updated?: string;

  /**
   * Additional details about the table
   */
  [key: string]: any;
}

/**
 * Parameters for list_tables tool
 */
export interface ListTablesParams {
  /**
   * The application ID to list tables for
   */
  app_id?: string;

  /**
   * Whether to include hidden tables
   */
  include_hidden?: boolean;

  /**
   * Filter tables by name (case-insensitive substring match)
   */
  filter?: string;
}

/**
 * Response from listing tables
 */
export interface ListTablesResult {
  /**
   * Array of tables in the application
   */
  tables: TableInfo[];

  /**
   * The application ID that was queried
   */
  appId: string;
}

/**
 * Tool for listing all tables in a Quickbase application
 */
export class ListTablesTool extends BaseTool<
  ListTablesParams,
  ListTablesResult
> {
  public name = "list_tables";
  public description = "Lists all tables in the Quickbase application";

  /**
   * Parameter schema for list_tables
   */
  public paramSchema = {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description: "The ID of the application",
      },
      include_hidden: {
        type: "boolean",
        description: "Whether to include hidden tables",
      },
      filter: {
        type: "string",
        description: "Filter tables by name (case-insensitive substring match)",
      },
    },
    required: [],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the list_tables tool
   * @param params Tool parameters
   * @returns List of tables in the application
   */
  protected async run(params: ListTablesParams): Promise<ListTablesResult> {
    const { app_id, include_hidden, filter } = params;

    // Use provided app_id or fall back to the one from config
    const appId = app_id || this.client.getConfig().appId;

    if (!appId) {
      throw new Error(
        "Application ID is required but not provided in parameters or configuration",
      );
    }

    logger.info("Listing tables in Quickbase application", {
      appId,
      includeHidden: include_hidden,
    });

    // Prepare query parameters
    const queryParams: Record<string, string> = {};

    if (include_hidden !== undefined) {
      queryParams.includeHidden = include_hidden.toString();
    }

    // List tables in the application
    const response = await this.client.request({
      method: "GET",
      path: `/tables?appId=${appId}`,
      params: queryParams,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to list tables", {
        error: response.error,
        appId,
      });
      throw new Error(response.error?.message || "Failed to list tables");
    }

    // Cast data to array of tables
    let tables = (response.data as Record<string, any>[]).map((table) => ({
      id: table.id,
      name: table.name,
      description: table.description,
      singleRecordName: table.singleRecordName,
      pluralRecordName: table.pluralRecordName,
      created: table.created,
      updated: table.updated,
      ...table,
    }));

    // Filter tables if requested
    if (filter && filter.trim() !== "") {
      const filterLower = filter.toLowerCase();
      tables = tables.filter(
        (table) =>
          table.name.toLowerCase().includes(filterLower) ||
          (table.description &&
            table.description.toLowerCase().includes(filterLower)),
      );
    }

    logger.info(`Found ${tables.length} tables in application`, { appId });

    return {
      tables,
      appId,
    };
  }
}
