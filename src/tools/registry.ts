import { McpTool, ToolRegistry } from '../types/mcp';
import { createLogger } from '../utils/logger';

const logger = createLogger('ToolRegistry');

/**
 * Implementation of the MCP Tool Registry
 * Manages all available MCP tools
 */
export class ToolRegistryImpl implements ToolRegistry {
  private tools: Map<string, McpTool<any, any>> = new Map();
  
  /**
   * Get a tool by name
   * @param name Tool name
   * @returns The tool or undefined if not found
   */
  public getTool(name: string): McpTool<any, any> | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Register a tool
   * @param tool Tool to register
   */
  public registerTool<TParams, TResult>(tool: McpTool<TParams, TResult>): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool with name ${tool.name} already exists, overwriting`);
    }
    
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: ${tool.name}`);
  }
  
  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getAllTools(): McpTool<any, any>[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tool names
   * @returns Array of tool names
   */
  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
  
  /**
   * Check if a tool exists
   * @param name Tool name
   * @returns True if the tool exists
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }
  
  /**
   * Get tool count
   * @returns Number of registered tools
   */
  public getToolCount(): number {
    return this.tools.size;
  }
}

// Create singleton instance
export const toolRegistry = new ToolRegistryImpl();