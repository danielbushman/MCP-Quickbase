# MCP Tools Specification

This document describes the design and implementation of the MCP (Model Context Protocol) tools for the Quickbase connector v2.

## MCP Tools Architecture

```
┌───────────────────────────────────────────────┐
│                 MCP Tools                      │
│                                               │
│   ┌────────────────┐      ┌────────────────┐  │
│   │  ToolRegistry  │◄────►│    BaseTool    │  │
│   └────────────────┘      └────────┬───────┘  │
│           ▲                        │          │
│           │                        ▼          │
│   ┌───────┴──────────────────────────────┐    │
│   │              Tool Implementations     │    │
│   │                                       │    │
│   │  ┌────────────┐       ┌────────────┐ │    │
│   │  │    Test    │       │ Configure  │ │    │
│   │  │ Connection │       │   Cache    │ │    │
│   │  └────────────┘       └────────────┘ │    │
│   │                                       │    │
│   │  ┌────────────┐       ┌────────────┐ │    │
│   │  │    App     │       │   Table    │ │    │
│   │  │ Management │       │ Operations │ │    │
│   │  └────────────┘       └────────────┘ │    │
│   │                                       │    │
│   │  ┌────────────┐       ┌────────────┐ │    │
│   │  │   Field    │       │  Record    │ │    │
│   │  │ Management │       │ Operations │ │    │
│   │  └────────────┘       └────────────┘ │    │
│   │                                       │    │
│   │  ┌────────────┐       ┌────────────┐ │    │
│   │  │    File    │       │  Report    │ │    │
│   │  │  Handling  │       │ Execution  │ │    │
│   │  └────────────┘       └────────────┘ │    │
│   └───────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

## Core Components

### Tool Registry

The Tool Registry (`registry.ts`) manages all available MCP tools:

- **Responsibilities**:
  - Tool registration and retrieval
  - Tool discoverability
  - Tool name resolution

- **Key Methods**:
  - `registerTool()`: Add a tool to the registry
  - `getTool()`: Get a tool by name
  - `getAllTools()`: Get all registered tools
  - `getToolNames()`: Get names of all registered tools

### Base Tool

The Base Tool (`base.ts`) is an abstract class that all tool implementations extend:

- **Responsibilities**:
  - Define common tool structure
  - Handle parameter validation
  - Provide consistent error handling
  - Manage execution flow

- **Common Properties**:
  - `name`: Tool name
  - `description`: Tool description
  - `paramSchema`: Schema for parameter validation

- **Key Methods**:
  - `execute()`: Public method to execute the tool
  - `run()`: Abstract method implemented by specific tools
  - `validateParams()`: Validate parameters against schema

## Tool Implementations

### Connection Tools

1. **test_connection**
   - **Description**: Tests the connection to Quickbase
   - **Parameters**: None
   - **Returns**: Connection status, user information, and realm details
   - **Implementation**: Makes a request to the Quickbase userinfo endpoint

2. **configure_cache**
   - **Description**: Configures caching behavior
   - **Parameters**:
     - `enabled`: Whether to enable caching
     - `clear`: Whether to clear the cache
     - `ttl`: Cache TTL in seconds
   - **Returns**: Cache configuration status
   - **Implementation**: Manages the CacheService instance

## Server Integration

The MCP tools are integrated with the Express server through these endpoints:

1. **`/api/:tool`** - Single tool execution
   - **Method**: POST
   - **Path Parameters**: Tool name
   - **Body**: Tool parameters
   - **Response**: Tool execution result

2. **`/api/batch`** - Batch tool execution
   - **Method**: POST
   - **Body**: Array of tool requests
   - **Response**: Array of tool execution results

3. **`/api/schema`** - Tools schema discovery
   - **Method**: GET
   - **Response**: Schema information for all tools

## Parameter Validation

Parameters are validated using a basic schema validation approach:

```typescript
protected validateParams(params: TParams): void {
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
```

## Error Handling

Errors are handled consistently across all tools:

1. **Tool-level errors**: Caught within the `execute()` method
2. **API-level errors**: Handled by the client
3. **Server-level errors**: Caught by Express error handlers

Error responses follow the format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "type": "ErrorType"
  }
}
```

## Future Enhancements

1. **Schema Validation**: Replace basic validation with a full JSON Schema validator
2. **Parameter Coercion**: Add type coercion for parameters
3. **Middleware Integration**: Add middleware for common tool operations
4. **Tool Versioning**: Support versioned tools
5. **Improved Documentation**: Add schema-based documentation generation