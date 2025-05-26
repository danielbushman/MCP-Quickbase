# Quickbase MCP Server

A TypeScript-based Model Context Protocol (MCP) server for Quickbase, designed for seamless integration with Claude Desktop and other AI assistants.

> **📋 Community Project Notice**  
> This is a community-developed integration that is not an official Quickbase product. While it uses Quickbase's public APIs, it is not officially supported by Quickbase, Inc. This project is provided "as is" and maintained by the community. For official Quickbase products and support, please visit [quickbase.com](https://www.quickbase.com).

## 🚀 Quick Start for Claude Desktop

### One-Line Setup Check

```bash
curl -fsSL https://raw.githubusercontent.com/danielbushman/MCP-Quickbase/main/check_dependencies.sh | bash
```

### Configure Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quickbase": {
      "command": "npx",
      "args": ["-y", "mcp-quickbase"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-user-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

**That's it!** Restart Claude Desktop and you can start using Quickbase tools.

---

## 📦 Installation Options

### Option 1: NPM (Recommended)

```bash
# Use directly with npx (no installation needed)
npx -y mcp-quickbase

# Or install globally
npm install -g mcp-quickbase
```

### Option 2: From Source

```bash
# Clone the repository
git clone https://github.com/danielbushman/MCP-Quickbase.git
cd MCP-Quickbase

# Install dependencies
npm install

# Build the project
npm run build
```

For source installation, use this Claude Desktop configuration:

```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["/path/to/MCP-Quickbase/dist/mcp-stdio-server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-user-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

## 🔧 Configuration

### Required Environment Variables

- **`QUICKBASE_REALM_HOST`** - Your Quickbase realm (e.g., `company.quickbase.com`)
- **`QUICKBASE_USER_TOKEN`** - Your Quickbase API token ([Get one here](https://help.quickbase.com/en/articles/8672050))
- **`QUICKBASE_APP_ID`** - Default application ID (optional)

### Optional Settings

- **`QUICKBASE_CACHE_ENABLED`** - Enable caching (`true`/`false`, default: `true`)
- **`QUICKBASE_CACHE_TTL`** - Cache duration in seconds (default: `3600`)
- **`DEBUG`** - Enable debug logging (`true`/`false`, default: `false`)
- **`LOG_LEVEL`** - Logging level (`DEBUG`/`INFO`/`WARN`/`ERROR`, default: `INFO`)

## 🛠️ Available Tools

### Connection & Configuration
- **`test_connection`** - Test connection to Quickbase
- **`configure_cache`** - Configure caching behavior

### Application Management
- **`create_app`** - Create new Quickbase applications
- **`update_app`** - Update existing applications
- **`list_tables`** - List all tables in an application

### Table Operations
- **`create_table`** - Create new tables
- **`update_table`** - Update table properties
- **`get_table_fields`** - Get field information for a table

### Field Management
- **`create_field`** - Create new fields in tables
- **`update_field`** - Update field properties

### Record Operations
- **`query_records`** - Query records with filtering and sorting
- **`create_record`** - Create single records
- **`update_record`** - Update existing records
- **`bulk_create_records`** - Create multiple records
- **`bulk_update_records`** - Update multiple records

### File Operations
- **`upload_file`** - Upload files to file attachment fields
- **`download_file`** - Download files from records

### Reporting
- **`run_report`** - Execute Quickbase reports

## 📚 Usage Examples

### Basic Record Query
```
Query all customers from the Customers table
```

### Create a New Record
```
Create a new customer record with name "Acme Corp" and status "Active"
```

### Upload a File
```
Upload invoice.pdf to the Documents field in record 123
```

## 🔒 Security

- API tokens are handled securely and never logged
- All file operations are sandboxed to the working directory
- Supports field-level permissions and access controls

## 📋 Requirements

- Node.js 18 or higher
- Valid Quickbase account with API access
- Claude Desktop (for MCP integration)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Quickbase API Documentation](https://developer.quickbase.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)