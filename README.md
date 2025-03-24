# Quickbase MCP Connector

**DISCLAIMER: This is an unofficial, independent project not affiliated with, sponsored, or endorsed by Quickbase, Inc. This connector is provided "as-is" without warranty of any kind and is not supported by Quickbase. Users are responsible for their own compliance with all applicable laws, regulations, and security requirements when using this connector.**

A Model Context Protocol (MCP) connector for integrating with the [Quickbase JSON RESTful API](https://developer.quickbase.com/).

## Overview

This MCP connector provides a standardized interface for AI assistants to integrate with Quickbase's API through the Model Context Protocol. It supports a wide range of operations for managing apps, tables, fields, records, files, and reports with Quickbase.

## Features

- **Focused API Coverage**: Access to supported and well-tested Quickbase API endpoints
- **Structured Data**: All responses are formatted consistently for easy parsing
- **File Operations**: Upload and download file attachments
- **Error Handling**: Detailed error messages with status codes and descriptions
- **Bulk Operations**: Support for efficient batch record operations
- **Pagination**: Support for handling large result sets

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- Quickbase API credentials (realm hostname, user token, and app ID)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/danielbushman/Quickbase-MCP-connector.git
cd Quickbase-MCP-connector
```

2. Set up the environment:
```bash
./setup.sh
```

3. Configure your Quickbase credentials:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Quick Start

For those who just want to try this connector with Claude or Claude Code:

1. Install dependencies and set up the server:
```bash
# Install all dependencies
npm install
pip install -r requirements.txt

# Create a .env file with your Quickbase credentials
echo "QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here" > .env
```

2. Start the MCP server:
```bash
node src/quickbase/server.js
```

3. In Claude or Claude Code, use the connector:
```
# In Claude, add the Quickbase connector via the connections menu
# In Claude Code, use this command
claude mcp add quickbase node src/quickbase/server.js
```

Now you can use Quickbase tools in your Claude session! Example prompt:
"List all tables in my Quickbase app using the quickbase connector."

## Usage

### Starting the MCP Server

```bash
node src/quickbase/server.js
```

### Running Tests

All tests are located in the `tests/` directory. You can use the test runner to run specific tests or all tests:

```bash
# Run all tests
python tests/run_tests.py --all

# Run specific tests
python tests/run_tests.py connection pagination file

# Run the comprehensive validation script
python tests/run_tests.py validate
```

Individual test scripts can also be run directly:

```bash
# Test connection
python tests/test_connection.py

# Test file operations
python tests/test_file_operations.py

# Test pagination
python tests/test_pagination.py
```

For more information about tests, see [tests/README.md](tests/README.md).

## Available Tool Categories

### Connection Tools
- `test_connection`: Verify your Quickbase API connection
- `check_auth`: Check authentication status and permissions

### App Tools
- `get_app`: Get details about a specific app
- `get_apps`: List all available apps
- `create_app`, `update_app`: Create and update applications

### Table Tools
- `get_table`, `get_tables`: Retrieve table information
- `create_table`, `update_table`: Create and update tables

### Field Tools
- `get_field`, `get_fields`: Retrieve field information
- `create_field`, `update_field`: Create and update fields

### Record Tools
- `get_record`, `query_records`: Retrieve record data
- `create_record`, `update_record`: Individual record operations
- `bulk_create_records`, `bulk_update_records`: Efficient batch operations

### File Tools
- `upload_file`: Upload a file to a record field
- `download_file`: Download a file from a record field
- `manage_attachments`: High-level attachment management

### Report Tools
- `run_report`: Execute Quickbase reports

## Not implemented

The following operations are not implemented:
- Delete operations (delete_app, delete_table, delete_field, delete_record, bulk_delete_records, delete_file)
- User operations (get_user, get_current_user, get_user_roles, manage_users)
- Form operations (manage_forms)
- Dashboard operations (manage_dashboards)
- Pipelines operations (manage_pipelines)
- FastField Form operations (manage_fast_field_form)

## Environment Variables

The following environment variables need to be configured:

```
# Quickbase API Credentials
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here

# For file operation testing
QUICKBASE_TABLE_ID=your_table_id_here
QUICKBASE_RECORD_ID=your_record_id_here
QUICKBASE_FILE_FIELD_ID=your_file_field_id_here

# MCP Server Settings (optional)
MCP_SERVER_PORT=3535
```

## Error Handling

The connector provides comprehensive error handling with:
- Error type classification
- HTTP status codes
- Detailed error messages from Quickbase API
- Suggested solutions
- Parameter validation
- JSON data validation
- Proper handling of API request errors

### Common Error Scenarios
- Missing required parameters
- Invalid JSON data format
- Non-existent table or field IDs
- Invalid WHERE clause syntax
- Authentication failures
- Permission issues
- Network connectivity problems

All error responses include helpful diagnostic information to assist with troubleshooting.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details