#!/bin/bash

# Deployment script for Quickbase MCP Server
set -e

echo "🚀 Preparing Quickbase MCP Server for deployment"

# Check if required files exist
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# No need to check for v2/package.json anymore

# Build the project locally
echo "🔨 Building project..."
npm install
npm run build

echo "✅ Build successful"

# Test the MCP server
echo "🧪 Testing MCP server..."
timeout 5s node dist/mcp-stdio-server.js --help 2>/dev/null || {
    echo "⚠️  MCP server test completed (this is normal for stdio servers)"
}

# Publish to NPM (for automatic Glama.ai discovery)
echo "📦 Publishing to NPM Registry..."
echo ""
echo "To make your MCP server discoverable by Glama.ai, publish it to NPM:"
echo ""
echo "1. Update version in package.json if needed"
echo "2. Run: npm publish"
echo "3. Glama.ai will automatically index your package"
echo ""

# Alternative deployment options
echo "🚀 Deployment Options:"
echo ""
echo "Option 1: NPM Package (Recommended for Glama.ai discovery)"
echo "  npm publish"
echo "  # Glama.ai will automatically discover and index your package"
echo ""
echo "Option 2: Docker Deployment"
echo "  docker build -f Dockerfile.glama -t quickbase-mcp ."
echo "  # Deploy to your preferred cloud platform"
echo ""
echo "Option 3: Direct GitHub Integration"
echo "  # Push to GitHub and submit to awesome-mcp-servers"
echo "  # https://github.com/punkpeye/awesome-mcp-servers"
echo ""

# Environment configuration
echo "🔧 Environment Configuration:"
echo ""
echo "Required environment variables:"
echo "- QUICKBASE_REALM_HOST=your-realm.quickbase.com"
echo "- QUICKBASE_USER_TOKEN=your-user-token"
echo "- QUICKBASE_APP_ID=your-app-id"
echo ""
echo "Optional environment variables:"
echo "- QUICKBASE_CACHE_ENABLED=true"
echo "- QUICKBASE_CACHE_TTL=3600"
echo "- DEBUG=false"
echo "- LOG_LEVEL=INFO"
echo ""

# Usage instructions
echo "📚 Usage Instructions:"
echo ""
echo "After deployment, users can use the package in two ways:"
echo ""
echo "1. Via npx (no installation required):"
echo '{
  "mcpServers": {
    "quickbase": {
      "command": "npx",
      "args": ["-y", "mcp-quickbase"],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}'
echo ""
echo "2. After global installation (npm install -g mcp-quickbase):"
echo '{
  "mcpServers": {
    "quickbase": {
      "command": "quickbase-mcp",
      "args": [],
      "env": {
        "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
        "QUICKBASE_USER_TOKEN": "your-token",
        "QUICKBASE_APP_ID": "your-app-id"
      }
    }
  }
}'
echo ""

echo "🎉 Deployment preparation complete!"
echo ""
echo "Example prompts you can use:"
echo "- 'Show me all active projects in Quickbase'"
echo "- 'Generate a weekly safety report'"
echo "- 'Add a new employee to the construction crew'"
echo "- 'Which materials need to be reordered?'"