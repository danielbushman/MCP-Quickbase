import { McpTool } from '../types/mcp';
import { ApiResponse } from '../types/api';
import { QuickbaseClient } from '../client/quickbase';
import { createLogger } from '../utils/logger';

const logger = createLogger('BaseTool');

/**
 * Base class for MCP tools
 */
export abstract class BaseTool<TParams, TResult> implements McpTool<TParams, TResult> {
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
   * Validate parameters against schema
   * This is a simple implementation - in production this would use JSON Schema
   * @param params Parameters to validate
   */
  protected validateParams(params: TParams): void {
    // For now, just check if required properties exist
    const schemaProps = this.paramSchema.properties as Record<string, any>;
    const requiredProps = this.paramSchema.required as string[];
    
    if (requiredProps && Array.isArray(requiredProps)) {
      for (const prop of requiredProps) {
        if (!(params as any)[prop]) {
          throw new Error(`Missing required parameter: ${prop}`);
        }
      }
    }
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
      this.validateParams(params);
      
      // Execute the tool implementation
      const result = await this.run(params);
      
      logger.debug(`Tool ${this.name} executed successfully`, { result });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error(`Error executing tool ${this.name}`, { error });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.name : 'UnknownError'
        }
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