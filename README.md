# Quickbase Connector for Claude

Connect Claude directly to your Quickbase data. Ask questions, create records, run reports, and more - all through natural language.

**DISCLAIMER: This is an unofficial, independent project not affiliated with, sponsored, or endorsed by Quickbase, Inc.**

![Quickbase + Claude](docs/images/quickbase-claude.png)

## ⚡ Quick Setup for Claude

```bash
# One-line setup
curl -sSL https://raw.githubusercontent.com/danielbushman/Quickbase-MCP-connector/main/auto_setup.sh | bash

# Configure your credentials
cd ~/Quickbase-MCP-connector
./configure.sh
```

## 🚀 What Can I Do With This?

- **Ask about your data**: "How many open projects do we have?"
- **Create records**: "Create a new customer named Acme Inc."
- **Run reports**: "Run my 'Overdue Tasks' report"
- **Upload files**: "Upload this document to the project record"
- **Analyze data**: "Which sales rep has the highest conversion rate?"

## 🔧 Manual Setup

### For Claude Desktop

1. Configure Claude Desktop to use the connector:

```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["path/to/Quickbase-MCP-connector/src/server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

### For Claude Code

```bash
claude mcp add quickbase node src/server.js
```

## 📚 Documentation

- [Quickstart Guide](docs/quickstart.md)
- [Available Tools](docs/tools.md)
- [Architecture](docs/architecture.md)
- [Development](docs/development.md)

## 📦 Project Structure

- `src/` - Connector implementation
- `docs/` - Documentation
- `tests/` - Test suite
- `v1/` - Original implementation (reference)

## 🔄 Version 2.0 (In Development)

Building a streamlined TypeScript-based implementation with:
- Single language architecture (TypeScript)
- Enhanced Claude integration
- Improved error handling
- Simplified setup process

## ⚖️ License

MIT