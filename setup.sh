#!/bin/bash

echo "========================================="
echo "    Quickbase MCP Integration Setup"
echo "             Version 1.0.0"
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
chmod +x src/quickbase/server.js
chmod +x run_tests.sh
chmod +x test_file_operations.py
chmod +x test_pagination.py
chmod +x test_remaining_operations.py

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your Quickbase credentials."
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your Quickbase credentials"
echo "2. Start the server with: node src/quickbase/server.js"
echo "3. Test the connection with: python test_connection.py"
echo "4. Run all tests with: ./run_tests.sh"
echo ""
echo "For more information, see README.md"
echo "========================================="