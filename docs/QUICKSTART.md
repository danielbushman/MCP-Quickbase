# Quickbase MCP Integration: Quick Start Guide

This guide will help you get started with the Quickbase MCP Integration quickly.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- Quickbase account with API access
- Quickbase User Token
- Quickbase Realm Hostname
- Quickbase App ID

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/MCP-Quickbase.git
cd MCP-Quickbase
```

2. **Run the setup script**

```bash
./setup.sh
```

This will:
- Check your Python and Node.js versions
- Create a Python virtual environment
- Install all required dependencies
- Make necessary scripts executable
- Create a `.env` file template

3. **Configure your Quickbase credentials**

Edit the `.env` file with your Quickbase credentials:

```
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here
```

## Usage

### Starting the MCP Server

```bash
node src/quickbase/server.js
```

This will start the MCP server and listen for connections.

### Testing the Connection

In a new terminal window, run:

```bash
python test_connection.py
```

If successful, you should see:
```
Connection successful!
```

### Using the Quickbase MCP Integration

Once the server is running, you can use the MCP tools to interact with your Quickbase app:

#### Listing Tables

```bash
python -c "import asyncio; from src.quickbase.server import handle_call_tool; print(asyncio.run(handle_call_tool('list_tables', {})))"
```

#### Querying Records

Create a file `query_example.py`:

```python
import asyncio
import json
from src.quickbase.server import handle_call_tool

async def query_records():
    table_id = "your_table_id_here"
    query_args = {
        "table_id": table_id,
        "select": ["3", "6", "7"],  # Replace with your field IDs
        "where": "",  # No filtering
        "options": {
            "top": 10  # Get up to 10 records
        }
    }
    result = await handle_call_tool("query_records", query_args)
    for content in result:
        print(content.text)

if __name__ == "__main__":
    asyncio.run(query_records())
```

Then run:
```bash
python query_example.py
```

## Available Tools

The Quickbase MCP Integration provides these main tools:

### App Operations
- `test_connection`: Test your connection to Quickbase
- `get_app`, `get_apps`: Retrieve app information
- `create_app`, `update_app`: Create and update apps

### Table Operations
- `get_tables`, `get_table`: Retrieve table information
- `create_table`, `update_table`: Create and update tables

### Field Operations
- `get_table_fields`: Retrieve field information
- `create_field`, `update_field`: Create and update fields

### Record Operations
- `query_records`: Query records with optional filtering and pagination
- `create_record`, `update_record`: Create and update individual records
- `bulk_create_records`, `bulk_update_records`: Batch record operations

### File Operations
- `upload_file`, `download_file`: Manage file attachments

### Report Operations
- `run_report`: Execute Quickbase reports

## Troubleshooting

### Connection Issues
- Verify your credentials in the `.env` file
- Ensure your Quickbase User Token has API access
- Check your network connection

### Table/Field IDs
- Quickbase table and field IDs are numeric. You can find them in the Quickbase UI by going to:
  - Table settings > Advanced table features > Table ID
  - Field settings > Advanced field properties > Field ID

## Next Steps

- Check the full README.md for comprehensive documentation
- Run the test suite with `./run_tests.sh`
- Explore the API with the provided example scripts