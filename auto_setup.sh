#!/bin/bash

echo "========================================="
echo "    Quickbase MCP Connector Installer"
echo "             Part 1: Environment Setup"
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
read -p "Installation path [$HOME/Quickbase-MCP-connector]: " user_install_dir
# Set install directory with a fallback to default
if [ -z "$user_install_dir" ]; then
    # Default location
    export install_dir="$HOME/Quickbase-MCP-connector"
else
    # User provided location
    export install_dir="$user_install_dir"
fi

# Print out value for debugging
echo "Using installation directory: $install_dir"

# Check if directory already exists
if [ -d "${install_dir}" ]; then
    echo "Warning: Directory ${install_dir} already exists."
    read -p "Do you want to continue and possibly overwrite existing files? (y/n): " overwrite
    if [[ "$overwrite" != "y" && "$overwrite" != "Y" ]]; then
        echo "Installation cancelled."
        exit 1
    fi
    # Remove the directory to avoid git clone errors
    rm -rf "${install_dir}"
fi

# Create the directory
mkdir -p "${install_dir}"

# Clone or update the repository
echo "Setting up the Quickbase MCP connector repository..."

# Check if .git directory exists (it's already a git repo)
if [ -d "${install_dir}/.git" ]; then
    # It's already a git repo, just pull the latest changes
    echo "Repository already exists, updating it..."
    (cd "${install_dir}" && git pull)
else
    # Fresh clone
    echo "Cloning the repository..."
    git clone https://github.com/danielbushman/Quickbase-MCP-connector.git "${install_dir}"
fi

if [ $? -ne 0 ]; then
    echo "Failed to set up repository. Please check your internet connection and try again."
    exit 1
fi

echo "Repository setup completed successfully."

# Change to the installation directory
cd "${install_dir}"

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
chmod +x configure.sh

# Direct output with hardcoded paths where necessary
INSTALLATION_PATH="$install_dir"

echo
echo "======================================================"
echo "    Environment Setup Complete! 🎉"
echo "======================================================"
echo
echo "The Quickbase MCP connector has been installed to:"
echo "$INSTALLATION_PATH"
echo
echo "Next steps:"
echo "1. Run the configuration script to set up your credentials:"
printf "   cd \"%s\" && ./configure.sh\n" "$INSTALLATION_PATH"
echo
echo "For more information, see the README.md in the installation directory"
echo "======================================================"