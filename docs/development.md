# Development Guide

This guide is for developers who want to contribute to or modify the Quickbase Connector.

## Project Structure

```
quickbase-mcp-connector/
├── src/                # Source code
│   ├── client/         # Quickbase API client
│   ├── mcp/            # MCP tool implementations
│   ├── utils/          # Utility functions
│   └── server.js       # Main server entry point
├── docs/               # Documentation
├── tests/              # Test suite
└── v1/                 # Original implementation (reference)
```

## Technology Stack

- **Primary Language**: TypeScript/JavaScript
- **Runtime**: Node.js
- **API Client**: Built-in fetch API with custom retry logic
- **Testing**: Jest
- **MCP Implementation**: Express.js

## Setting Up for Development

1. Clone the repository:

```bash
git clone https://github.com/danielbushman/Quickbase-MCP-connector.git
cd Quickbase-MCP-connector
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment:

```bash
cp .env.example .env
# Edit .env with your development credentials
```

4. Run in development mode:

```bash
npm run dev
```

## Code Style and Guidelines

We follow these conventions:

- **TypeScript**: Use strict typing
- **Naming**: camelCase for variables and functions, PascalCase for classes
- **Error Handling**: Comprehensive try/catch with detailed error messages
- **Logging**: Structured logging with sensitive data redaction
- **Documentation**: JSDoc comments for all public APIs
- **Testing**: Write tests for all new functionality

## Architecture

The connector follows a layered architecture:

1. **MCP Layer**: Exposes tools to Claude
2. **Client Layer**: Core Quickbase API client
3. **Utility Layer**: Shared functionality (caching, logging, etc.)

See the [Architecture document](architecture.md) for more details.

## Adding a New Tool

1. Create a new file in `src/mcp/tools/` for your tool
2. Implement the tool function with proper parameter validation
3. Add the tool to the tool registry in `src/mcp/toolRegistry.ts`
4. Add tests in the `tests/` directory
5. Document the tool in `docs/tools.md`

Example:

```typescript
// src/mcp/tools/myNewTool.ts
import { QuickbaseClient } from '../../client/client';

export interface MyNewToolParams {
  param1: string;
  param2?: number;
}

export async function myNewTool(
  client: QuickbaseClient, 
  params: MyNewToolParams
) {
  // Validate parameters
  if (!params.param1) {
    throw new Error('param1 is required');
  }
  
  // Implement tool logic
  const result = await client.someOperation(params.param1, params.param2);
  
  // Return formatted result
  return {
    success: true,
    data: result
  };
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run specific tests:

```bash
npm test -- tests/specificTest.test.js
```

## Building for Production

```bash
npm run build
```

## Releasing a New Version

1. Update version in package.json
2. Update CHANGELOG.md
3. Build the project
4. Create a GitHub release
5. Publish to npm if appropriate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

Please follow the existing code style and include tests for new functionality.