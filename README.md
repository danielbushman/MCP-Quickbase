# Quickbase MCP Server

A Model Context Protocol (MCP) server for interacting with the [Quickbase JSON RESTful API](https://developer.quickbase.com/).

## Overview

This MCP server provides a standardized interface for interacting with Quickbase's API through Claude and other MCP clients. It supports various operations including querying records, managing table relationships, handling file attachments, and more.

## Prerequisites

- Node.js 14 or higher
- Quickbase API credentials (realm, user token, and app ID)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MCP-Quickbase.git
cd MCP-Quickbase
```

2. Install the package globally using npm:
```bash
npm install -g mcp-quickbase-connector
```

3. Configure your Quickbase credentials in your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-quickbase-connector",
        "quickbase"
      ],
      "env": {
        "QUICKBASE_REALM": "your-realm",
        "QUICKBASE_USER_TOKEN": "your-user-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

4. Restart Claude to apply the changes.

## Usage

Once installed and configured, you can use the Quickbase MCP server through Claude. The server provides several tools for interacting with Quickbase:

### Available Tools

1. **Query Records**
   ```json
   {
     "table_id": "your_table_id",
     "select": ["field1", "field2"],
     "where": "field1 = 'value'",
     "options": {
       "skip": 0,
       "top": 100,
       "groupBy": ["field1"],
       "orderBy": [{"field": "field1", "order": "asc"}]
     }
   }
   ```

2. **Get Table Relationships**
   ```json
   {
     "table_id": "your_table_id"
   }
   ```

3. **Manage Attachments**
   ```json
   {
     "table_id": "your_table_id",
     "record_id": "your_record_id",
     "action": "upload",
     "file": {
       "name": "example.pdf",
       "content": "base64_encoded_content",
       "content_type": "application/pdf"
     }
   }
   ```

4. **Manage Users**
   ```json
   {
     "action": "add",
     "user": {
       "email": "user@example.com",
       "role": "viewer",
       "tables": ["table_id1", "table_id2"]
     }
   }
   ```

5. **Manage Forms**
   ```json
   {
     "table_id": "your_table_id",
     "action": "update",
     "form": {
       "name": "New Form",
       "fields": ["field1", "field2"],
       "properties": {
         "style": "modern",
         "layout": "vertical"
       }
     }
   }
   ```

6. **Manage Dashboards**
   ```json
   {
     "action": "create",
     "dashboard": {
       "name": "New Dashboard",
       "tables": ["table_id1", "table_id2"],
       "charts": [
         {
           "type": "bar",
           "title": "Sales by Month",
           "data": {
             "table": "table_id1",
             "groupBy": "month",
             "aggregate": "sum",
             "valueField": "sales"
           }
         }
       ]
     }
   }
   ```

7. **Run Reports**
   ```json
   {
     "report_id": "your_report_id",
     "options": {
       "format": "pdf",
       "filters": {
         "date_range": "last_30_days",
         "categories": ["category1", "category2"]
       },
       "grouping": ["field1", "field2"],
       "sorting": [{"field": "field1", "order": "desc"}]
     }
   }
   ```

## Error Handling

The server provides detailed error messages for common issues:

- Missing credentials
- Invalid table IDs
- Permission errors
- API rate limits
- Network connectivity issues

## Security

- Credentials are managed through Claude's configuration
- All API calls are encrypted
- User tokens are never stored locally
- Access is controlled through Quickbase's permission system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 