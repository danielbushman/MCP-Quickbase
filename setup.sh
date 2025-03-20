#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install npm dependencies locally
npm install

# Make server.js executable
chmod +x src/quickbase/server.js

echo "Setup complete! Please configure your Quickbase credentials in claude_desktop_config.json" 