# V1 Legacy Implementation (Reference Only)

⚠️ **WARNING: This is the legacy v1 implementation and is provided for reference only.**

The v1 implementation has been superseded by v2, which offers:
- Pure TypeScript implementation (no Python dependencies)
- Better type safety and error handling
- Improved performance and caching
- More comprehensive test coverage
- Better MCP integration

## Migration to v2

Please use the v2 implementation in the root directory. To migrate:

1. Update your Claude configuration to use the new entry point:
   ```json
   {
     "mcpServers": {
       "quickbase": {
         "command": "node",
         "args": ["path/to/quickbase-mcp-connector/dist/mcp-stdio-server.js"]
       }
     }
   }
   ```

2. Update your environment variables (same format, but in root .env file)

3. All tools remain the same with improved implementations

## V1 Structure (Historical Reference)

- Mixed Python/Node.js implementation
- Python API client with Node.js MCP wrapper
- Required both Python and Node.js runtimes
- ~38% test coverage
- Known issues with error handling and type safety

This directory is maintained for historical reference only. All new development should use v2.
