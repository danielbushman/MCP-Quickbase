# Quickbase MCP Connector (v2)

Modern, redesigned implementation of the Quickbase MCP Connector.

## Project Structure

- `src/quickbase/` - Quickbase API client implementation
- `src/mcp/` - MCP tool implementations
- `tests/` - Test suite
- `docs/` - Documentation

## Getting Started

1. Install dependencies: `npm install && pip install -r requirements.txt`
2. Configure your Quickbase credentials
3. Start the server: `npm start`

## Features

- Full Quickbase API support through MCP
- Efficient caching system
- Robust error handling and retry logic
- Comprehensive logging with PII redaction