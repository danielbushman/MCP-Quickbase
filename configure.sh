#!/bin/sh

echo "========================================="
echo "    Quickbase MCP Server Configurator"
echo "             Part 2: Credentials Setup"
echo "========================================="

# Prompt for Quickbase credentials
echo
echo "Setting up Quickbase credentials..."
echo
echo "Please enter your Quickbase credentials:"
read -p "Quickbase Realm Host (e.g., your-realm.quickbase.com): " realm_host
read -p "Quickbase User Token: " user_token
read -p "Quickbase App ID: " app_id

# Create .env file in the current directory
echo "QUICKBASE_REALM_HOST=${realm_host}
QUICKBASE_USER_TOKEN=${user_token}
QUICKBASE_APP_ID=${app_id}
PORT=3536" > .env

echo "Credentials saved to .env file in $(pwd)"

# Set up Claude Desktop configuration
echo
echo "Setting up Claude Desktop configuration..."

# Determine the platform and Claude Desktop config path
case "${OSTYPE}" in
  darwin*)
    config_dir="${HOME}/Library/Application Support/Claude"
    config_file="${config_dir}/claude_desktop_config.json"
    ;;
  linux-gnu*)
    config_dir="${HOME}/.config/Claude"
    config_file="${config_dir}/claude_desktop_config.json"
    ;;
  msys*|cygwin*|win32*)
    config_dir="${APPDATA}/Claude"
    config_file="${config_dir}/claude_desktop_config.json"
    ;;
  *)
    echo "Unsupported operating system. Please configure Claude Desktop manually."
    config_file=""
    ;;
esac

# Check if config file already exists
config_backup=""
if [ -f "${config_file}" ]; then
    config_backup="${config_file}.backup"
    echo "Backing up existing Claude Desktop configuration to ${config_backup}"
    cp "${config_file}" "${config_backup}"
    
    # Read existing config
    existing_config=$(cat "${config_file}")
    case "${existing_config}" in
      *'"mcpServers"'*)
        echo "Warning: Existing MCP servers configuration found."
        read -p "Would you like to overwrite it? (y/n): " overwrite
        if [ "${overwrite}" != "y" ] && [ "${overwrite}" != "Y" ]; then
            echo "Please manually update your Claude Desktop configuration. See the README.md for instructions."
            exit 0
        fi
        ;;
    esac
fi

if [ ! -z "${config_file}" ]; then
    # Create config directory if it doesn't exist
    mkdir -p "${config_dir}"
    
    # Get absolute paths
    current_dir=$(pwd)
    node_path=$(command -v node)
    server_path="${current_dir}/dist/mcp-stdio-server.js"
    
    # Create or update Claude Desktop config
    echo "{
  \"mcpServers\": {
    \"quickbase\": {
      \"command\": \"${node_path}\",
      \"args\": [
        \"${server_path}\"
      ],
      \"env\": {
        \"QUICKBASE_REALM_HOST\": \"${realm_host}\",
        \"QUICKBASE_USER_TOKEN\": \"${user_token}\",
        \"QUICKBASE_APP_ID\": \"${app_id}\",
        \"PORT\": \"3536\"
      }
    }
  }
}" > "${config_file}"

    echo "Claude Desktop configuration created at: ${config_file}"
    if [ ! -z "${config_backup}" ]; then
        echo "Your previous configuration was backed up to: ${config_backup}"
    fi
fi

echo
echo "======================================================"
echo "    Configuration Complete! 🎉"
echo "======================================================"
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