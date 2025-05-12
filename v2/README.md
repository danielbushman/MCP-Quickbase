# Quickbase MCP Connector (v2)

Modern, redesigned implementation of the Quickbase MCP Connector using TypeScript.

## Project Structure

- `src/client/` - Quickbase API client implementation
- `src/tools/` - MCP tool implementations
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and services
- `tests/` - Test suite

## Getting Started

1. Install dependencies: `npm install`
2. Configure your Quickbase credentials (copy `.env.example` to `.env`)
3. Start the server: `npm start`

## Development

- Build: `npm run build`
- Dev mode: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## Features

- Full Quickbase API support through MCP
- Strong TypeScript typing
- Efficient caching system
- Robust error handling and retry logic
- Comprehensive logging with PII redaction