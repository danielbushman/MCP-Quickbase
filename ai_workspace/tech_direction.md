# Technical Direction for v2

Decision made: We are standardizing on Node.js for v2.

## OriginalLanguage Choice Investigation

After analyzing v1, we've decided to standardize on a single primary language for v2. The options are:

### Node.js (JavaScript/TypeScript)
- **Pros**:
  - MCP servers are typically implemented in Node.js
  - Excellent HTTP client libraries
  - Async/await pattern fits API interactions well
  - TypeScript adds strong typing for better safety
- **Cons**:
  - Some of the existing Python utilities would need reimplementation

### Python
- **Pros**:
  - Strong data processing capabilities
  - Existing caching and retry logic
  - Type annotations available
- **Cons**:
  - MCP server implementation would be less standard
  - Potentially less efficient for HTTP server

## Recommendation

We recommend standardizing on **Node.js with TypeScript** for the entire codebase:

1. The MCP server is already JavaScript-based
2. TypeScript provides safety similar to Python type annotations
3. Better alignment with typical MCP implementations
4. More straightforward deployment (single runtime)

This choice will simplify the architecture, reduce cross-language complexity, and create a more consistent codebase.
