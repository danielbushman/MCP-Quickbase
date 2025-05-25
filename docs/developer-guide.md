# Developer Guide - Quickbase MCP Connector v2

This guide provides detailed information for developers working on or extending the Quickbase MCP Connector v2.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Code Organization](#code-organization)
- [Adding New Tools](#adding-new-tools)
- [Testing Strategy](#testing-strategy)
- [TypeScript Patterns](#typescript-patterns)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Debugging](#debugging)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

### Core Components

The connector is built using a modular architecture with the following key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Server    │    │   Tool Registry │    │  Quickbase API  │
│                 │    │                 │    │     Client      │
│ - Stdio Mode    │◄──►│ - Tool Manager  │◄──►│                 │
│ - HTTP Mode     │    │ - Schema Validation│    │ - HTTP Client   │
│                 │    │                 │    │ - Auth Handler  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tool Layer    │    │  Utility Layer  │    │   Type Layer    │
│                 │    │                 │    │                 │
│ - Apps Tools    │    │ - Cache Service │    │ - API Types     │
│ - Table Tools   │    │ - Retry Logic   │    │ - Config Types  │
│ - Record Tools  │    │ - File Utils    │    │ - MCP Types     │
│ - Field Tools   │    │ - Logger        │    │ - Tool Types    │
│ - File Tools    │    │                 │    │                 │
│ - Report Tools  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Design Principles

1. **TypeScript-First**: All code is written in TypeScript with strict type checking
2. **Modular Design**: Tools are organized by functionality and can be extended independently
3. **Error Resilience**: Comprehensive error handling with graceful degradation
4. **Performance**: Intelligent caching and retry mechanisms
5. **Developer Experience**: Clear interfaces, comprehensive logging, and detailed error messages

## 🚀 Development Setup

### Prerequisites

```bash
# Required tools
node --version  # v18+
npm --version   # v6+
```

### Initial Setup

```bash
# Clone and setup
git clone <repository-url>
cd mcp-quickbase

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Quickbase credentials

# Build and test
npm run build
npm test
```

### Development Workflow

```bash
# Development mode with auto-reload
npm run dev

# Watch mode for tests
npm test -- --watch

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
```

## 📁 Code Organization

### Directory Structure

```
src/
├── client/                 # Quickbase API client
│   └── quickbase.ts       # Main API client implementation
├── mcp/                   # MCP server implementations
│   ├── index.ts          # Exports
│   └── server.ts         # MCP server setup and tool registration
├── tools/                 # MCP tool implementations
│   ├── base.ts           # Base tool class
│   ├── registry.ts       # Tool registry and management
│   ├── apps/             # Application management tools
│   ├── fields/           # Field management tools
│   ├── files/            # File operation tools
│   ├── records/          # Record operation tools
│   ├── reports/          # Report execution tools
│   └── tables/           # Table operation tools
├── types/                 # TypeScript type definitions
│   ├── api.ts            # Quickbase API types
│   ├── config.ts         # Configuration types
│   └── mcp.ts            # MCP-specific types
├── utils/                 # Utility functions
│   ├── cache.ts          # Caching service
│   ├── file.ts           # File handling utilities
│   ├── logger.ts         # Logging service
│   └── retry.ts          # Retry logic implementation
├── mcp-stdio-server.ts    # Stdio MCP server entry point
└── server.ts             # HTTP server entry point
```

### Naming Conventions

- **Files**: kebab-case (`create-record.ts`)
- **Classes**: PascalCase (`CreateRecordTool`)
- **Variables/Functions**: camelCase (`executeQuery`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (`QuickbaseConfig`)

## 🔧 Adding New Tools

### 1. Create Tool Class

```typescript
// src/tools/my-category/my-new-tool.ts
import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

interface MyNewToolParams {
  required_param: string;
  optional_param?: number;
}

interface MyNewToolResult {
  success: boolean;
  data: any;
}

export class MyNewTool extends BaseTool<MyNewToolParams, MyNewToolResult> {
  public readonly name = 'my_new_tool';
  public readonly description = 'Description of what this tool does';
  public readonly paramSchema = {
    type: 'object',
    properties: {
      required_param: {
        type: 'string',
        description: 'Description of required parameter'
      },
      optional_param: {
        type: 'number',
        description: 'Description of optional parameter'
      }
    },
    required: ['required_param']
  };

  constructor(client: QuickbaseClient) {
    super(client);
  }

  protected async run(params: MyNewToolParams): Promise<MyNewToolResult> {
    // Implement tool logic here
    const response = await this.client.request({
      method: 'POST',
      path: '/some/endpoint',
      body: params
    });

    return {
      success: true,
      data: response.data
    };
  }
}
```

### 2. Register Tool

```typescript
// src/tools/my-category/index.ts
import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { MyNewTool } from './my-new-tool';
import { createLogger } from '../../utils/logger';

const logger = createLogger('MyCategoryTools');

export function registerMyCategoryTools(client: QuickbaseClient): void {
  logger.info('Registering my category tools');
  
  toolRegistry.registerTool(new MyNewTool(client));
  
  logger.info('My category tools registered');
}

export * from './my-new-tool';
```

### 3. Add to Main Tool Registration

```typescript
// src/tools/index.ts
import { registerMyCategoryTools } from './my-category';

export function initializeTools(client: QuickbaseClient, cache: CacheService): void {
  // ... existing registrations
  
  // Register my category tools
  registerMyCategoryTools(client);
  
  // ... rest of function
}
```

### 4. Add Tests

```typescript
// src/__tests__/tools/my-new-tool.test.ts
import { MyNewTool } from '../../tools/my-category/my-new-tool';
import { QuickbaseClient } from '../../client/quickbase';

jest.mock('../../client/quickbase');

describe('MyNewTool', () => {
  let tool: MyNewTool;
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    mockClient = new QuickbaseClient({
      realmHost: 'test.quickbase.com',
      userToken: 'test-token'
    }) as jest.Mocked<QuickbaseClient>;
    
    tool = new MyNewTool(mockClient);
  });

  it('should have correct properties', () => {
    expect(tool.name).toBe('my_new_tool');
    expect(tool.description).toBeTruthy();
    expect(tool.paramSchema).toBeDefined();
  });

  it('should execute successfully', async () => {
    mockClient.request = jest.fn().mockResolvedValue({
      success: true,
      data: { result: 'success' }
    });

    const result = await tool.execute({
      required_param: 'test'
    });

    expect(result.success).toBe(true);
    expect(mockClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/some/endpoint',
      body: { required_param: 'test' }
    });
  });
});
```

## 🧪 Testing Strategy

### Test Organization

```
src/__tests__/
├── client.test.ts           # API client tests
├── cache.test.ts           # Cache service tests
├── integration.test.ts      # Full system integration tests
├── tools.test.ts           # Tool registry tests
└── tools/                  # Individual tool tests
    ├── records.test.ts     # Record operation tools
    └── test_connection.test.ts
```

### Test Types

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **Mocking**: Mock external dependencies (Quickbase API)
4. **Coverage**: Maintain >35% coverage, aim for >80%

### Running Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- client.test.ts

# Verbose output
npm test -- --verbose
```

## 📝 TypeScript Patterns

### Strict Type Safety

```typescript
// Use strict types for all function parameters and returns
async function processRecord(
  tableId: string,
  recordData: Record<string, unknown>
): Promise<ApiResponse<RecordResult>> {
  // Implementation
}

// Use discriminated unions for different response types
type ToolResult = 
  | { success: true; data: any }
  | { success: false; error: ApiError };
```

### Generic Tool Base Class

```typescript
// The BaseTool class uses generics for type safety
export abstract class BaseTool<TParams, TResult> {
  protected abstract run(params: TParams): Promise<TResult>;
  
  public async execute(params: TParams): Promise<ApiResponse<TResult>> {
    // Implementation with full type safety
  }
}
```

### Interface Definitions

```typescript
// Separate interfaces for different concerns
interface QuickbaseConfig {
  realmHost: string;
  userToken: string;
  appId?: string;
  cacheEnabled?: boolean;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  params?: Record<string, string>;
}
```

## ⚠️ Error Handling

### Error Types

```typescript
// Structured error hierarchy
export class QuickbaseError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'QuickbaseError';
  }
}

export class QuickbaseAuthError extends QuickbaseError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'QuickbaseAuthError';
  }
}
```

### Error Handling Pattern

```typescript
// Consistent error handling in tools
protected async run(params: MyParams): Promise<MyResult> {
  try {
    const response = await this.client.request(options);
    return this.processResponse(response);
  } catch (error) {
    if (error instanceof QuickbaseAuthError) {
      throw new Error('Authentication failed. Check your user token.');
    }
    if (error instanceof QuickbaseRateLimitError) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw error; // Re-throw unknown errors
  }
}
```

## ⚡ Performance Considerations

### Caching Strategy

```typescript
// Cache frequently accessed data
const cacheKey = `table-fields-${tableId}`;
const cachedFields = cache.get(cacheKey);

if (cachedFields && !options.skipCache) {
  return cachedFields;
}

const fields = await this.fetchTableFields(tableId);
cache.set(cacheKey, fields);
return fields;
```

### Bulk Operations

```typescript
// Prefer bulk operations for multiple records
const bulkResult = await this.client.request({
  method: 'POST',
  path: '/records',
  body: {
    to: tableId,
    data: records.map(record => this.formatRecord(record))
  }
});
```

### Pagination

```typescript
// Handle large datasets with pagination
async function queryAllRecords(params: QueryParams): Promise<Record[]> {
  const allRecords: Record[] = [];
  let skip = 0;
  const top = 1000;

  while (true) {
    const batch = await this.queryRecords({
      ...params,
      options: { ...params.options, skip, top }
    });

    allRecords.push(...batch.data);

    if (batch.data.length < top) break;
    skip += top;
  }

  return allRecords;
}
```

## 🐛 Debugging

### Logging

```typescript
// Use structured logging throughout
const logger = createLogger('ToolName');

logger.info('Starting operation', { tableId, recordCount });
logger.debug('Request details', { method, path, body });
logger.error('Operation failed', { error, context });
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true npm start

# Enable specific logger
DEBUG=QuickbaseClient npm start
```

### Common Issues

1. **Authentication Errors**: Check user token and realm hostname
2. **Rate Limiting**: Implement proper retry logic with backoff
3. **Cache Issues**: Clear cache or disable caching for debugging
4. **Type Errors**: Ensure all parameters match expected types

## 🤝 Contributing

### Code Style

- Use ESLint and Prettier configurations
- Follow existing patterns and conventions
- Add comprehensive tests for new features
- Update documentation for public APIs

### Pull Request Process

1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure all tests pass
4. Update documentation
5. Submit pull request with clear description

### Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No breaking changes to existing APIs
- [ ] Error handling is comprehensive
- [ ] Performance impact is considered

---

For more specific questions, check the inline code documentation or open an issue on GitHub.