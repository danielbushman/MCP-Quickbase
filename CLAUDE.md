# Claude Guidelines for Quickbase MCP Server

## Project Overview

A TypeScript MCP server for Quickbase integration with Claude Desktop and other AI assistants. Published as `mcp-quickbase` on npm.

**Repository**: https://github.com/danielbushman/MCP-Quickbase

## Build/Run/Test Commands

```bash
# Setup and build
npm install
npm run build

# Start servers
npm start                    # MCP stdio server
npm run start:http          # HTTP server (debugging)

# Development mode
npm run dev                 # Auto-reload development server

# Testing
npm test                    # Run all tests
npm test -- --coverage     # Run tests with coverage
npm test -- --watch        # Watch mode for development

# Code quality
npm run lint               # ESLint
npm run format             # Prettier formatting

# Publishing
npm run prepublishOnly     # Build and test before publish
```

## Project Structure

```
src/
├── mcp-stdio-server.ts      # Main entry point (MCP stdio)
├── server.ts                # HTTP server entry point
├── client/
│   └── quickbase.ts         # Quickbase API client
├── mcp/
│   ├── index.ts             # MCP exports
│   └── server.ts            # MCP server setup
├── tools/
│   ├── base.ts              # BaseTool abstract class
│   ├── registry.ts          # Tool registration
│   ├── index.ts             # Tool exports
│   ├── test_connection.ts   # Connection testing
│   ├── configure_cache.ts   # Cache configuration
│   ├── apps/                # Application tools
│   ├── tables/              # Table tools
│   ├── fields/              # Field tools
│   ├── records/             # Record CRUD tools
│   ├── files/               # File upload/download
│   └── reports/             # Report execution
├── types/
│   ├── api.ts               # API response types
│   ├── config.ts            # Configuration types
│   └── mcp.ts               # MCP types
├── utils/
│   ├── cache.ts             # Cache service
│   ├── logger.ts            # Logging with redaction
│   ├── validation.ts        # Zod validation
│   ├── retry.ts             # Retry logic
│   └── file.ts              # File utilities
└── __tests__/               # Test files
```

## Code Style

- **TypeScript**: Strict type checking enabled
- **Style**: ESLint + Prettier configuration
- **Naming**:
  - Files: kebab-case (`create-record.ts`)
  - Classes: PascalCase (`CreateRecordTool`)
  - Variables/Functions: camelCase (`executeQuery`)
  - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Imports**: Organized - local modules, then third-party, then Node.js built-ins
- **Error handling**: Structured `ApiResponse<T>` objects with success/error states
- **Logging**: Centralized logger with sensitive data redaction
- **API calls**: Built-in retry logic with exponential backoff
- **Validation**: Zod schemas for parameter validation

## Testing

### Standards
- **Coverage**: Maintain >35% coverage, aim for >80%
- **Types**: Unit tests, integration tests, performance tests
- **Structure**: Tests mirror src/ directory structure
- **Mocking**: Mock external dependencies (Quickbase API)
- **Isolation**: Tests should be isolated and idempotent
- **Requirements**: New features require corresponding tests

### Test Files
```
src/__tests__/
├── client.test.ts           # API client tests
├── cache.test.ts            # Cache service tests
├── integration.test.ts      # Full system tests
├── performance.test.ts      # Performance benchmarks
├── tools.test.ts            # Tool registry tests
├── validation.test.ts       # Validation utility tests
└── tools/
    ├── records.test.ts      # Record tool tests
    ├── reports.test.ts      # Report tool tests
    └── test_connection.test.ts
```

## Tool Development Pattern

All tools extend `BaseTool` and follow this pattern:

```typescript
import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

interface MyToolParams {
  tableId: string;
  // ... other params
}

interface MyToolResult {
  // ... result shape
}

export class MyTool extends BaseTool<MyToolParams, MyToolResult> {
  public readonly name = 'my_tool';
  public readonly description = 'Tool description';

  public readonly paramSchema = {
    type: 'object',
    properties: {
      tableId: { type: 'string', description: 'Table ID' },
    },
    required: ['tableId'],
  };

  protected async run(params: MyToolParams): Promise<MyToolResult> {
    // Use this.client for Quickbase API calls
    const result = await this.client.someMethod(params);
    return result;
  }
}
```

Register new tools in `src/tools/registry.ts`.

## Configuration

### Environment Variables
```env
# Required
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your-token

# Optional
QUICKBASE_APP_ID=your-app-id
QUICKBASE_CACHE_ENABLED=true
QUICKBASE_CACHE_TTL=3600
DEBUG=false
LOG_LEVEL=INFO
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "npx",
      "args": ["-y", "mcp-quickbase"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

For local development, use:
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["/absolute/path/to/dist/mcp-stdio-server.js"],
      "env": { ... }
    }
  }
}
```

## Development Workflow

1. Use TypeScript with strict typing
2. Follow existing tool patterns (extend `BaseTool`)
3. Add comprehensive tests for new features
4. Run `npm run lint` and `npm test` before commits
5. Update documentation for public APIs

## Available Tools

- **Connection**: `check_configuration`, `test_connection`, `configure_cache`
- **Apps**: `create_app`, `update_app`, `list_tables`
- **Tables**: `create_table`, `update_table`, `get_table_fields`
- **Fields**: `create_field`, `update_field`
- **Records**: `query_records`, `create_record`, `update_record`, `bulk_create_records`, `bulk_update_records`
- **Files**: `upload_file`, `download_file`
- **Reports**: `run_report`
