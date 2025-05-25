# Quick Start Guide

This guide will help you set up the Quickbase MCP Connector and start using it with Claude within minutes.

## 📋 Prerequisites

- Claude Desktop or Claude Code
- Node.js 18+ and npm
- Quickbase account with API access
- Valid Quickbase user token

## 🚀 Quick Setup (Recommended)

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
3. Build and prepare the connector

## 🔧 Manual Setup

If you prefer to handle the setup yourself:

### Step 1: Clone and Install

```bash
git clone https://github.com/danielbushman/Quickbase-MCP-connector.git
cd Quickbase-MCP-connector

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Configure Environment

Create a `.env` file in the project root directory:

```env
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here
QUICKBASE_CACHE_ENABLED=true
QUICKBASE_CACHE_TTL=3600
DEBUG=false
```

### Step 3: Test the Setup

```bash
# Test the connection
npm start
```

## 🔗 Connecting to Claude

### Claude Desktop Configuration

1. Find your Claude Desktop config location:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the Quickbase MCP Connector configuration:

```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["/absolute/path/to/Quickbase-MCP-connector/dist/mcp-stdio-server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

3. Restart Claude Desktop

### Claude Code Configuration

Register the MCP connector:

```bash
claude mcp add quickbase node /absolute/path/to/Quickbase-MCP-connector/dist/mcp-stdio-server.js
```

## ✅ Testing the Connection

1. Start a conversation with Claude
2. Ask it to test the Quickbase connection:

```
Can you test my Quickbase connection?
```

Claude should respond with connection status and user information.

## 🛠️ Example Commands

Here are some examples of what you can ask Claude to do:

### Basic Operations
- "List all tables in my Quickbase app"
- "Show me the fields in the Customers table"
- "Test my Quickbase connection"

### Record Operations
- "Create a new project record with the name 'Website Redesign'"
- "Find all customer records created in the last month"
- "Update record ID 123 in the Projects table"

### Data Analysis
- "Run my 'Overdue Tasks' report and summarize the results"
- "Show me all high-priority items"
- "Count the total number of open projects"

### File Operations
- "Upload this document to record ID 456"
- "Download the attachment from record ID 789"

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your Quickbase credentials in the .env file
   - Ensure your user token has the required permissions
   - Check that your realm hostname is correct

2. **Permission Errors**
   - Confirm your user token has access to the specified app
   - Verify you have read/write permissions for the tables you're accessing

3. **Path Issues**
   - Use absolute paths in Claude configuration
   - Ensure the built files exist in `dist/`

4. **Claude Not Recognizing Tools**
   - Restart Claude Desktop after configuration changes
   - Check Claude logs for connection errors
   - Verify the JSON configuration syntax

### Debug Mode

Enable debug logging for detailed troubleshooting:

```env
DEBUG=true
LOG_LEVEL=DEBUG
```

For more detailed help, see the [Developer Guide](./v2/developer-guide.md).