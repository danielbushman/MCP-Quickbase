# Quickbase MCP Connector

A Model Context Protocol (MCP) connector that enables Claude to interact with Quickbase databases through natural language. Perfect for construction management, project tracking, workforce management, and business operations.

**DISCLAIMER: This is an unofficial, independent project not affiliated with, sponsored, or endorsed by Quickbase, Inc.**

![Quickbase + Claude](docs/images/quickbase-claude.png)

## 🚀 Quick Start

### Local Development
```bash
# Clone and setup
git clone <repository-url>
cd Quickbase-MCP-connector/v2
npm install
npm run build

# Configure environment
cp .env.example .env
# Edit .env with your Quickbase credentials

# Start the server
npm start
```

### Deploy for Remote Access (Recommended)
```bash
# Build and prepare for deployment
./deploy.sh

# Option 1: Publish to NPM (for Glama.ai auto-discovery)
npm publish

# Option 2: Deploy via Docker to your cloud platform
docker build -f Dockerfile.glama -t quickbase-mcp .
```

## 📋 What You Can Do

### Construction Management
- Track project progress and budgets
- Manage crews and workforce scheduling  
- Monitor materials and inventory
- Report and analyze safety incidents
- Generate executive dashboards

### Natural Language Interface
```
"Show me all active projects with their current status"
"Add a new safety incident for the downtown site"
"Which materials need to be reordered this week?"
"Generate a crew productivity report"
"Update the concrete pouring task to 85% complete"
```

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

- **[Deployment Guide](docs/deployment.md)**: Complete setup for Glama.ai
- **[Claude Prompts](docs/claude-prompts.md)**: Comprehensive natural language examples
- **[Quick Reference](docs/quick-reference.md)**: Common prompts cheat sheet
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