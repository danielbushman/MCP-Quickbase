#!/bin/bash

# Quick setup script for Quickbase MCP Server v2

echo "🚀 Quickbase MCP Server v2 Quick Setup"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required (found v$NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Check if build was successful
if [ -f "dist/mcp-stdio-server.js" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your Claude Desktop configuration:"
    echo "   - Change the path to: $(pwd)/dist/mcp-stdio-server.js"
    echo "2. Make sure your .env file contains:"
    echo "   - QUICKBASE_REALM_HOST=your-realm.quickbase.com"
    echo "   - QUICKBASE_USER_TOKEN=your-token"
    echo "3. Restart Claude Desktop"
    echo ""
    echo "🎉 Setup complete!"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi