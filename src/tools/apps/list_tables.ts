import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ListTablesTool");

/**
 * Parameters for list_tables tool
 */
export interface ListTablesParams {
  /**
   * The application ID to list tables for
   */
  app_id?: string;
}

/**
 * Table information
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
   * Additional table properties
   */
  [key: string]: unknown;
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
  public description = "Lists all tables in a Quickbase application";

  /**
   * Parameter schema for list_tables
   */
  public paramSchema = {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description:
          "The application ID to list tables for (uses default app if not specified)",
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
    const appId = params.app_id || this.client.getConfig().appId;

    if (!appId) {
      throw new Error(
        "No application ID provided and no default app configured",
      );
    }

    logger.info("Listing tables for application", { appId });

    // Get tables for the application
    const response = await this.client.request<Record<string, unknown>[]>({
      method: "GET",
      path: `/tables?appId=${appId}`,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to list tables", {
        error: response.error,
        appId,
      });
      throw new Error(response.error?.message || "Failed to list tables");
    }

    const tables = (response.data as Record<string, unknown>[]).map(
      (table) => ({
        id: table.id as string,
        name: table.name as string,
        description: table.description as string | undefined,
        ...table,
      }),
    );

    logger.info(`Found ${tables.length} tables in application`, { appId });

    return {
      tables,
      appId,
    };
  }
}
