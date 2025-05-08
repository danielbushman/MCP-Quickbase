#!/bin/bash

echo "========================================="
echo "    Quickbase MCP Connector Installer"
echo "             For Claude Desktop"
echo "========================================="

# Create temp directory
temp_dir=$(mktemp -d)
cd "$temp_dir"

echo "Checking for required dependencies..."

# Check for git
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

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

# Get install location
echo
echo "Where would you like to install the Quickbase MCP connector?"
echo "Default: $HOME/Quickbase-MCP-connector"
read -p "Installation path [$HOME/Quickbase-MCP-connector]: " install_dir
install_dir=${install_dir:-"$HOME/Quickbase-MCP-connector"}

# Clone the repository
echo "Cloning the Quickbase MCP connector repository..."
git clone https://github.com/danielbushman/Quickbase-MCP-connector.git "$install_dir"

if [ $? -ne 0 ]; then
    echo "Failed to clone repository. Please check your internet connection and try again."
    exit 1
fi

echo "Repository cloned successfully."

# Change to the installation directory
cd "$install_dir"

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Make scripts executable
echo "Setting up executables..."
chmod +x src/quickbase/server.js
chmod +x run_tests.sh

# Prompt for Quickbase credentials
echo
echo "Setting up Quickbase credentials..."
echo
echo "Please enter your Quickbase credentials:"
read -p "Quickbase Realm Host (e.g., your-realm.quickbase.com): " realm_host
read -p "Quickbase User Token: " user_token
read -p "Quickbase App ID: " app_id

# Create .env file
echo "QUICKBASE_REALM_HOST=$realm_host
QUICKBASE_USER_TOKEN=$user_token
QUICKBASE_APP_ID=$app_id
MCP_SERVER_PORT=3535" > "$install_dir/.env"

echo "Credentials saved to .env file."

# Set up Claude Desktop configuration
echo
echo "Setting up Claude Desktop configuration..."

# Determine the platform and Claude Desktop config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    config_dir="$HOME/Library/Application Support/Claude"
    config_file="$config_dir/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    config_dir="$HOME/.config/Claude"
    config_file="$config_dir/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32"* ]]; then
    config_dir="$APPDATA/Claude"
    config_file="$config_dir/claude_desktop_config.json"
else
    echo "Unsupported operating system. Please configure Claude Desktop manually."
    config_file=""
fi

# Check if config file already exists
config_backup=""
if [ -f "$config_file" ]; then
    config_backup="${config_file}.backup"
    echo "Backing up existing Claude Desktop configuration to $config_backup"
    cp "$config_file" "$config_backup"
    
    # Read existing config
    existing_config=$(cat "$config_file")
    if [[ "$existing_config" == *"\"mcpServers\""* ]]; then
        echo "Warning: Existing MCP servers configuration found."
        read -p "Would you like to overwrite it? (y/n): " overwrite
        if [[ "$overwrite" != "y" && "$overwrite" != "Y" ]]; then
            echo "Please manually update your Claude Desktop configuration. See the README.md for instructions."
            exit 0
        fi
    fi
fi

if [ ! -z "$config_file" ]; then
    # Create config directory if it doesn't exist
    mkdir -p "$config_dir"
    
    # Get absolute paths
    node_path=$(which node)
    server_path="$install_dir/src/quickbase/server.js"
    
    # Create or update Claude Desktop config
    echo "{
  \"mcpServers\": {
    \"quickbase\": {
      \"command\": \"$node_path\",
      \"args\": [
        \"$server_path\"
      ],
      \"env\": {
        \"QUICKBASE_REALM_HOST\": \"$realm_host\",
        \"QUICKBASE_USER_TOKEN\": \"$user_token\",
        \"QUICKBASE_APP_ID\": \"$app_id\",
        \"MCP_SERVER_PORT\": \"3535\"
      }
    }
  }
}" > "$config_file"

    echo "Claude Desktop configuration created at: $config_file"
    if [ ! -z "$config_backup" ]; then
        echo "Your previous configuration was backed up to: $config_backup"
    fi
fi

echo
echo "======================================================"
echo "    Installation Complete! 🎉"
echo "======================================================"
echo
echo "The Quickbase MCP connector has been installed to:"
echo "$install_dir"
echo
echo "Configuration:"
echo "- Claude Desktop is configured to use the connector"
echo "- Your Quickbase credentials are saved in .env"
echo
echo "Next steps:"
echo "1. Restart Claude Desktop if it's already running"
echo "2. In Claude Desktop, try a prompt like:"
echo "   \"List all tables in my Quickbase app\""
echo
echo "For more information, see the README.md in the installation directory"
echo "======================================================"