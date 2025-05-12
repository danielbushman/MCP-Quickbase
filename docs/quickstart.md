# Quickstart Guide

This guide will help you set up the Quickbase Connector for Claude and start using it within minutes.

## Prerequisites

- Claude Desktop or Claude Code (Claude Pro subscription)
- Node.js 14+ and npm
- Python 3.8+ (for v1 only)
- Quickbase account with API access

## Setup Options

### Option 1: Automatic Setup (Recommended)

The automatic setup handles everything for you:

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/danielbushman/Quickbase-MCP-connector/main/auto_setup.sh | bash

# Configure your Quickbase credentials
cd ~/Quickbase-MCP-connector
./configure.sh
```

The configure script will:
1. Ask for your Quickbase realm, token, and app ID
2. Create the necessary configuration for Claude
3. Start the connector service

### Option 2: Manual Setup

If you prefer to handle the setup yourself:

1. Clone the repository:
```bash
git clone https://github.com/danielbushman/Quickbase-MCP-connector.git
cd Quickbase-MCP-connector
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
```bash
# Create .env file
echo "QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here" > .env
```

4. Start the server:
```bash
node src/server.js
```

## Connecting to Claude

### With Claude Desktop

1. Find your Claude Desktop config location:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the Quickbase connector configuration:
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["/path/to/Quickbase-MCP-connector/src/server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

3. Restart Claude Desktop

### With Claude Code

Register the MCP connector:

```bash
claude mcp add quickbase node /path/to/Quickbase-MCP-connector/src/server.js
```

## Testing the Connection

1. Start a conversation with Claude
2. Ask it to test the Quickbase connection:

```
Can you check if my Quickbase connection is working?
```

Claude should respond with connection status information.

## Example Commands

Here are some examples of what you can ask Claude to do:

- "List all tables in my Quickbase app"
- "Show me the fields in the Customers table"
- "Create a new project record with the name 'Website Redesign'"
- "Run my 'Overdue Tasks' report and summarize the results"
- "Find all customer records created in the last month"

## Troubleshooting

If you encounter issues:

1. Check your credentials in the .env file
2. Make sure the server is running
3. Verify Claude can access the connector
4. Check the server logs for error messages

For more detailed help, see the [troubleshooting guide](troubleshooting.md).