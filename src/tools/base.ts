import { McpTool } from "../types/mcp";
import { ApiResponse } from "../types/api";
import { QuickbaseClient } from "../client/quickbase";
import { createLogger } from "../utils/logger";
import { validateParams } from "../utils/validation";

const logger = createLogger("BaseTool");

/**
 * Base class for MCP tools
 */
export abstract class BaseTool<TParams, TResult>
  implements McpTool<TParams, TResult>
{
  /**
   * Tool name
   */
  public abstract name: string;

  /**
   * Tool description
   */
  public abstract description: string;

  /**
   * Parameter schema for the tool
   */
  public abstract paramSchema: Record<string, unknown>;

  /**
   * QuickBase client instance
   */
  protected client: QuickbaseClient;

  /**
   * Constructor
   * @param client QuickBase client instance
   */
  constructor(client: QuickbaseClient) {
    this.client = client;
  }

  /**
   * Validate parameters against schema using Zod
   * @param params Parameters to validate
   * @returns Validated parameters
   */
  protected validateParams(params: unknown): TParams {
    return validateParams<TParams>(params, this.paramSchema, this.name);
  }

  /**
   * Execute the tool
   * @param params Tool parameters
   * @returns Tool result
   */
  public async execute(params: TParams): Promise<ApiResponse<TResult>> {
    try {
      logger.debug(`Executing tool: ${this.name}`, { params });

      // Validate parameters
      const validatedParams = this.validateParams(params);

      // Execute the tool implementation
      const result = await this.run(validatedParams);

      logger.debug(`Tool ${this.name} executed successfully`, { result });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorType = error instanceof Error ? error.name : "UnknownError";

      logger.error(`Error executing tool ${this.name}`, {
        error: errorMessage,
        type: errorType,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: {
          message: errorMessage,
          type: errorType,
        },
      };
    }
  }

  /**
   * Implement the tool's functionality
   * @param params Tool parameters
   * @returns Tool result
   */
  protected abstract run(params: TParams): Promise<TResult>;
}
