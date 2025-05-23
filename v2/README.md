# Quickbase MCP Connector v2

A TypeScript-based Model Context Protocol (MCP) connector for Quickbase, designed for seamless integration with Claude and other AI assistants.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/quickbase-mcp-connector.git
cd quickbase-mcp-connector/v2

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Create a `.env` file in the root directory:

```env
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your-user-token
QUICKBASE_APP_ID=your-app-id
QUICKBASE_CACHE_ENABLED=true
QUICKBASE_CACHE_TTL=3600
DEBUG=false
```

### Usage with Claude

1. **Configure MCP server**: Add to your Claude configuration:
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["path/to/quickbase-mcp-connector/v2/dist/mcp-stdio-server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-user-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

2. **Start using tools**: The connector provides 18 comprehensive tools for Quickbase operations.

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
- **`update_table`** - Update existing tables
- **`get_table_fields`** - Retrieve table field definitions

### Field Management
- **`create_field`** - Create new fields in tables
- **`update_field`** - Update existing field properties

### Record Operations
- **`query_records`** - Query records with advanced filtering
- **`create_record`** - Create single records
- **`update_record`** - Update existing records
- **`bulk_create_records`** - Create multiple records efficiently
- **`bulk_update_records`** - Update multiple records efficiently

### File Handling
- **`upload_file`** - Upload files to record fields
- **`download_file`** - Download files from record fields

### Reports
- **`run_report`** - Execute Quickbase reports with filters

## 🏗️ Architecture

### TypeScript-First Design
- **100% TypeScript** for type safety and developer experience
- **Comprehensive type definitions** for all Quickbase API interactions
- **Modern async/await** patterns throughout

### Performance Features
- **Intelligent caching** with configurable TTL
- **Automatic retry logic** for transient failures
- **Bulk operations** for high-performance data manipulation
- **Pagination support** for large datasets

### Error Handling
- **Structured error responses** with detailed context
- **Graceful degradation** for API failures
- **Comprehensive logging** for debugging

## 📚 Examples

### Basic Record Operations

```typescript
// Query records
const records = await queryRecords({
  table_id: "bqrxzt5wq",
  where: "{6.CT.'Project'}",
  select: ["1", "6", "7", "8"]
});

// Create a record
const newRecord = await createRecord({
  table_id: "bqrxzt5wq",
  data: {
    "6": "New Project",
    "7": "Project description",
    "8": "High"
  }
});

// Update multiple records
const updates = await bulkUpdateRecords({
  table_id: "bqrxzt5wq",
  records: [
    { "3": "123", "8": "Critical" },
    { "3": "124", "8": "Low" }
  ]
});
```

### File Operations

```typescript
// Upload a file
const upload = await uploadFile({
  table_id: "bqrxzt5wq",
  record_id: "123",
  field_id: "9",
  file_path: "/path/to/document.pdf"
});

// Download a file
const download = await downloadFile({
  table_id: "bqrxzt5wq",
  record_id: "123",
  field_id: "9",
  output_path: "/downloads/document.pdf"
});
```

### Advanced Queries with Pagination

```typescript
// Paginated query for large datasets
const largeDataset = await queryRecords({
  table_id: "bqrxzt5wq",
  select: ["1", "6", "7", "8"],
  paginate: true,
  max_records: "1000",
  options: {
    orderBy: [{ fieldId: "6", order: "ASC" }],
    top: 100
  }
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

Current test coverage: **37.79%** with comprehensive unit and integration tests.

## 🔧 Development

### Project Structure

```
src/
├── client/           # Quickbase API client
├── tools/           # MCP tool implementations
│   ├── apps/        # Application management tools
│   ├── fields/      # Field management tools
│   ├── files/       # File operation tools
│   ├── records/     # Record operation tools
│   ├── reports/     # Report execution tools
│   └── tables/      # Table operation tools
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── mcp/             # MCP server implementation
```

### Adding New Tools

1. Create tool class extending `BaseTool<TParams, TResult>`
2. Implement required properties and `run()` method
3. Register in appropriate tool category
4. Add comprehensive tests

Example:

```typescript
export class MyCustomTool extends BaseTool<MyParams, MyResult> {
  public readonly name = 'my_custom_tool';
  public readonly description = 'Description of my tool';
  public readonly paramSchema = { /* JSON Schema */ };

  protected async run(params: MyParams): Promise<MyResult> {
    // Implementation
  }
}
```

## 🚦 Deployment

### HTTP Server Mode
```bash
npm start  # Runs on port 3536
```

### MCP Stdio Mode
```bash
node dist/mcp-stdio-server.js
```

## 📋 Requirements

- **Node.js** 14+ 
- **TypeScript** 5.2+
- **Quickbase** account with API access
- **Valid user token** with appropriate permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [documentation](docs/)
- Review [common issues](docs/troubleshooting.md)
- Open an issue on GitHub

---

Built with ❤️ for seamless Quickbase integration with AI assistants.