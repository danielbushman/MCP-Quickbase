# Deploying Quickbase MCP Connector

This guide walks you through deploying the Quickbase MCP Connector for remote access and discovery through various platforms including Glama.ai.

## Prerequisites

1. **NPM Account**: For publishing to npm registry
2. **Quickbase Credentials**: Your realm, user token, and app ID
3. **Node.js & npm**: For building and publishing
4. **Docker** (optional): For containerized deployment

## Deployment Options

### Option 1: NPM Package (Recommended for Glama.ai Discovery)

Glama.ai automatically indexes MCP servers published to NPM.

#### 1. Prepare for Publication

```bash
# Clone this repository (if not already done)
git clone <repository-url>
cd MCP-Quickbase

# Build the project
npm install
npm run build
```

#### 2. Update Package Information

Edit `package.json` to update:
- Version number
- Author information  
- Repository URL
- Keywords for discovery

#### 3. Publish to NPM

```bash
# Login to NPM (first time only)
npm login

# Publish the package
npm publish

# Glama.ai will automatically discover and index your package
```

### Option 2: Docker Deployment

For custom cloud deployments using the provided Docker configuration.

#### Build and Deploy

```bash
# Build the Docker image
docker build -f Dockerfile.glama -t quickbase-mcp .

# Deploy to your preferred cloud platform
# (AWS, Google Cloud, Azure, etc.)
```

### Option 3: GitHub Integration

Submit to community MCP server registries for broader discovery.

```bash
# Push to GitHub
git push origin main

# Submit to awesome-mcp-servers
# Fork https://github.com/punkpeye/awesome-mcp-servers
# Add your server following their contribution guidelines
```

## Getting Your Quickbase Credentials

### Quickbase Realm Host
Your realm host is the domain you use to access Quickbase:
- Example: If you access Quickbase at `https://mycompany.quickbase.com`, your realm host is `mycompany.quickbase.com`

### User Token
1. Log into your Quickbase account
2. Go to **My Preferences** → **My User Information**
3. Click **Manage User Tokens**
4. Create a new token with appropriate permissions
5. Copy the token value

### Application ID
1. Open your Quickbase application
2. Look at the URL: `https://mycompany.quickbase.com/db/bxxxxxxx`
3. The application ID is the `bxxxxxxx` part (starts with 'b')

## Configuration for Claude Desktop

After deployment, configure the MCP server in Claude Desktop:

### NPM Package Installation
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "npm",
      "args": ["exec", "mcp-quickbase"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

### Local Development
```json
{
  "mcpServers": {
    "quickbase": {
      "command": "node",
      "args": ["path/to/MCP-Quickbase/dist/mcp-stdio-server.js"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}
```

## Environment Variables

### Required
- `QUICKBASE_REALM_HOST`: Your Quickbase realm (e.g., `mycompany.quickbase.com`)
- `QUICKBASE_USER_TOKEN`: Your Quickbase user token
- `QUICKBASE_APP_ID`: Your Quickbase application ID

### Optional
- `QUICKBASE_CACHE_ENABLED`: `true` (default) - Enable caching for better performance
- `QUICKBASE_CACHE_TTL`: `3600` (1 hour, default) - Cache time-to-live in seconds
- `DEBUG`: `false` (default) - Enable debug logging
- `LOG_LEVEL`: `INFO` (default) - Logging level (ERROR, WARN, INFO, DEBUG)

## Local Testing

Before deploying, test the MCP server locally:

```bash
# Build and test
./deploy.sh

# Or manually:
npm install
npm run build
node dist/mcp-stdio-server.js
```

## Usage Examples

Once deployed and configured, you can use these natural language prompts in Claude:

### Daily Operations
```
"Check our Quickbase system and show me which crews are working today"
```

### Project Management
```
"Give me a status update on all active projects with budget and timeline"
```

### Safety Reporting
```
"Generate a safety dashboard showing incidents by type and location"
```

### Inventory Management
```
"Show me materials below reorder threshold and create purchase orders"
```

## How Glama.ai Discovery Works

Glama.ai automatically indexes MCP servers through several methods:

1. **NPM Registry**: Automatically discovers packages with MCP-related keywords
2. **GitHub Repositories**: Indexes repositories tagged with MCP-related topics
3. **Community Submissions**: Accepts submissions through awesome-mcp-servers

Your package will appear on Glama.ai within 24-48 hours of publication to NPM.

## Monitoring and Troubleshooting

### Common Issues

**Connection Errors**: Verify your Quickbase credentials and network connectivity
**Permission Errors**: Ensure your user token has appropriate permissions
**Package Not Found**: Check that your NPM package is public and properly tagged

### Debug Mode
Enable verbose logging by setting:
```bash
DEBUG=true
LOG_LEVEL=DEBUG
```

## Security Best Practices

1. **User Token**: Never commit tokens to version control
2. **Permissions**: Use minimum required Quickbase permissions
3. **Network**: All connections use HTTPS/TLS
4. **Dependencies**: Keep dependencies updated for security patches

## Performance Optimization

- **Caching**: Enabled by default to reduce API calls and improve response times
- **Pagination**: Handles large datasets efficiently
- **Retry Logic**: Automatic retry with exponential backoff for transient failures

## Support and Community

### Getting Help
1. Check the [Claude Prompts documentation](claude-prompts.md)
2. Review [Quick Reference guide](quick-reference.md)
3. File issues in this repository
4. Join the MCP community discussions

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Next Steps

1. **Choose Deployment Option**: NPM publication recommended for ease of discovery
2. **Configure Credentials**: Set up your Quickbase connection
3. **Test Integration**: Verify MCP server works with Claude Desktop
4. **Explore Examples**: Try prompts from the documentation
5. **Customize for Your Needs**: Adapt the schema and prompts to your use case

For detailed usage examples, see [claude-prompts.md](claude-prompts.md) and [quick-reference.md](quick-reference.md).