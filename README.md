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

The server can start without environment variables configured, but tools will not be functional until proper configuration is provided. Use the `check_configuration` tool to verify your setup.

### Required Environment Variables

- **`QUICKBASE_REALM_HOST`** - Your Quickbase realm (e.g., `company.quickbase.com`)
- **`QUICKBASE_USER_TOKEN`** - Your Quickbase API token ([Get one here](https://help.quickbase.com/en/articles/8672050))

### Optional Environment Variables

- **`QUICKBASE_APP_ID`** - Default application ID

### Optional Settings

- **`QUICKBASE_CACHE_ENABLED`** - Enable caching (`true`/`false`, default: `true`)
- **`QUICKBASE_CACHE_TTL`** - Cache duration in seconds (default: `3600`)
- **`DEBUG`** - Enable debug logging (`true`/`false`, default: `false`)
- **`LOG_LEVEL`** - Logging level (`DEBUG`/`INFO`/`WARN`/`ERROR`, default: `INFO`)

## 🛠️ Available Tools (58 Total - 100% API Coverage)

### Connection & Configuration
- **`check_configuration`** - Check if Quickbase configuration is properly set up
- **`test_connection`** - Test connection to Quickbase
- **`configure_cache`** - Configure caching behavior

### Application Management (7 operations)
- **`create_app`** - Create new Quickbase applications
- **`get_app`** - Get application details
- **`update_app`** - Update existing applications
- **`delete_app`** - Delete applications
- **`copy_app`** - Duplicate applications for testing or backup
- **`list_tables`** - List all tables in an application
- **`get_app_events`** - List available event types for webhooks

### Table Operations (5 operations)
- **`create_table`** - Create new tables
- **`get_table`** - Get table details
- **`update_table`** - Update table properties
- **`delete_table`** - Delete tables
- **`get_table_fields`** - Get field information for a table

### Field Management (6 operations)
- **`create_field`** - Create new fields in tables
- **`get_field`** - Get field details
- **`update_field`** - Update field properties
- **`delete_fields`** - Delete fields from tables
- **`get_field_usage`** - Analyze individual field usage statistics
- **`get_fields_usage`** - Analyze usage for all fields in a table

### Record Operations (6 operations)
- **`query_records`** - Query records with filtering and sorting
- **`create_record`** - Create single records
- **`update_record`** - Update existing records
- **`bulk_create_records`** - Create multiple records at once
- **`bulk_update_records`** - Update multiple records at once
- **`delete_records`** - Delete records

### File Operations (3 operations)
- **`upload_file`** - Upload files to file attachment fields
- **`download_file`** - Download files from records
- **`delete_file`** - Delete file attachments

### Formula Operations (1 operation)
- **`run_formula`** - Execute Quickbase formulas without storing them

### Webhook Management (5 operations)
- **`create_webhook`** - Create event-driven webhooks
- **`list_webhooks`** - List all webhooks
- **`get_webhook`** - Get webhook details
- **`update_webhook`** - Update webhook configuration
- **`delete_webhook`** - Delete webhooks

### Report Operations (3 operations)
- **`list_reports`** - List available reports
- **`get_report`** - Get report details
- **`run_report`** - Execute Quickbase reports

### Relationship Management (4 operations)
- **`create_relationship`** - Create table relationships
- **`list_relationships`** - List table relationships
- **`update_relationship`** - Update relationships
- **`delete_relationship`** - Delete relationships

### User Management - SCIM 2.0 (6 operations)
- **`list_users`** - List all users with pagination
- **`get_user`** - Get user details by ID
- **`create_user`** - Create new users
- **`update_user`** - Update user information
- **`patch_user`** - Partially update users
- **`delete_user`** - Delete users

### Group Management - SCIM 2.0 (5 operations)
- **`list_groups`** - List all groups
- **`get_group`** - Get group details
- **`create_group`** - Create new groups
- **`update_group`** - Update group membership
- **`delete_group`** - Delete groups

### Token Management (4 operations)
- **`clone_user_token`** - Duplicate user tokens
- **`deactivate_user_token`** - Deactivate tokens
- **`delete_user_token`** - Delete tokens permanently
- **`get_temporary_token`** - Get temporary authentication tokens

### Audit & Compliance (1 operation)
- **`get_audit_logs`** - Retrieve audit logs for security monitoring

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