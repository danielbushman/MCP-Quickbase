# Quickbase MCP Connector

Connect Claude directly to your Quickbase data through the Model Context Protocol (MCP). Ask questions, create records, run reports, and more - all through natural language.

**DISCLAIMER: This is an unofficial, independent project not affiliated with, sponsored, or endorsed by Quickbase, Inc.**

![Quickbase + Claude](docs/images/quickbase-claude.png)

## 🚀 Quick Start

```bash
# One-line setup
curl -sSL https://raw.githubusercontent.com/danielbushman/Quickbase-MCP-connector/main/auto_setup.sh | bash

# Configure your credentials
cd ~/Quickbase-MCP-connector
./configure.sh
```

## 🛠️ What Can You Do?

- **Ask about your data**: "How many open projects do we have?"
- **Create records**: "Create a new customer named Acme Inc."
- **Run reports**: "Run my 'Overdue Tasks' report"
- **Upload files**: "Upload this document to the project record"
- **Analyze data**: "Which sales rep has the highest conversion rate?"

## 🔧 Configuration

### Claude Desktop Setup

1. Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["path/to/Quickbase-MCP-connector/v2/dist/mcp-stdio-server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

### Claude Code Setup

```bash
claude mcp add quickbase node v2/dist/mcp-stdio-server.js
```

## 📚 Documentation

- [Quick Start Guide](docs/quickstart.md)
- [Available Tools](docs/tools.md)
- [Architecture Overview](docs/architecture.md)
- [Development Guide](docs/development.md)
- [v2 Documentation](v2/README.md) - Current implementation
- [v1 Documentation](v1/README.md) - Legacy reference

## 📦 Project Structure

```
├── v2/                 # Current TypeScript implementation
│   ├── src/           # Source code
│   ├── docs/          # v2-specific documentation
│   └── dist/          # Built files
├── v1/                # Legacy Python implementation (reference)
├── docs/              # Shared documentation
└── ai_specs/          # Development specifications
```

## ⚡ Current Version: 2.0

The TypeScript-based v2 implementation provides:
- **TypeScript-first** architecture with full type safety
- **18 comprehensive tools** for Quickbase operations
- **Enhanced error handling** and logging
- **Performance optimizations** with caching and retry logic
- **Comprehensive testing** with 37%+ code coverage

### Migration from v1

v2 is the current recommended version. v1 remains available for reference but is no longer actively developed.

## ⚖️ License

MIT