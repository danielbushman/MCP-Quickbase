#!/bin/bash

echo "========================================="
echo "    Quickbase MCP Minimal Setup"
echo "========================================="

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d " " -f 2)
python_major=$(echo $python_version | cut -d. -f1)
python_minor=$(echo $python_version | cut -d. -f2)

echo "Detected Python version: $python_version"

if [ "$python_major" -lt 3 ] || [ "$python_major" -eq 3 -a "$python_minor" -lt 8 ]; then
    echo "Error: Python 3.8 or higher is required. Found Python $python_version"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

node_version=$(node --version | cut -c 2-)
node_major=$(echo $node_version | cut -d. -f1)

echo "Detected Node.js version: $node_version"

if [ "$node_major" -lt 14 ]; then
    echo "Error: Node.js 14 or higher is required. Found Node.js $node_version"
    exit 1
fi

echo "Environment checks passed. Proceeding with installation..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install npm dependencies locally
echo "Installing Node.js dependencies..."
npm install

# Make scripts executable
echo "Setting up executables..."
chmod +x dist/mcp-stdio-server.js
chmod +x run_tests.sh

echo ""
echo "Setup complete!"
echo ""
echo "NOTE: This setup assumes you already have the necessary"
echo "environment variables set in your .env file:"
echo "- QUICKBASE_REALM_HOST"
echo "- QUICKBASE_USER_TOKEN"
echo "- QUICKBASE_APP_ID"
echo "- MCP_SERVER_PORT (default: 3535)"
echo ""
echo "To start the server: node dist/mcp-stdio-server.js"
echo "To run tests: ./run_tests.sh"
echo ""
echo "For more information, see README.md"
echo "========================================="