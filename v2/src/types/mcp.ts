/**
 * Types for the MCP (Model Context Protocol) integration
 */
import { ApiResponse } from './api';

/**
 * Base MCP tool interface
 */
export interface McpTool<TParams, TResult> {
  /**
   * Tool name
   */
  name: string;
  
  /**
   * Tool description
   */
  description: string;
  
  /**
   * Function to execute the tool
   */
  execute: (params: TParams) => Promise<ApiResponse<TResult>>;
  
  /**
   * Parameter schema for the tool
   */
  paramSchema: Record<string, unknown>;
}

/**
 * MCP tool registry
 */
export interface ToolRegistry {
  /**
   * Get a tool by name
   */
  getTool(name: string): McpTool<unknown, unknown> | undefined;
  
  /**
   * Register a tool
   */
  registerTool<TParams, TResult>(tool: McpTool<TParams, TResult>): void;
  
  /**
   * Get all registered tools
   */
  getAllTools(): McpTool<unknown, unknown>[];
}

/**
 * MCP request format
 */
export interface McpRequest {
  /**
   * Name of the tool to execute
   */
  tool: string;
  
  /**
   * Tool parameters
   */
  params?: Record<string, unknown>;
}