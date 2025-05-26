#!/bin/bash
# This script will install and configure Quickbase MCP Server
# It's designed to work when run both locally and via curl | bash

echo "========================================="
echo "    Quickbase MCP Server Installer"
echo "             Part 1: Environment Setup"
echo "========================================="

# Create temp directory
temp_dir=$(mktemp -d)
cd "$temp_dir" || { echo "Failed to create temp directory"; exit 1; }

echo "Checking for required dependencies..."

# Check for git
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Note: Python is no longer required for v2 (TypeScript-based)

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

node_version=$(node --version | cut -c 2-)
node_major=$(echo $node_version | cut -d. -f1)

echo "Detected Node.js version: $node_version"

if [ "$node_major" -lt 18 ]; then
    echo "Error: Node.js 18 or higher is required for v2. Found Node.js $node_version"
    exit 1
fi

echo "Environment checks passed. Proceeding with installation..."

# Set a default installation directory
DEFAULT_INSTALL_DIR="$HOME/mcp-quickbase"

# When running curl | bash, let's just use the default location
# for a more reliable experience
if [ -t 0 ]; then
    # Interactive terminal, ask for location
    echo
    echo "Where would you like to install Quickbase MCP Server?"
    echo "Default: $DEFAULT_INSTALL_DIR"
    read -p "Installation path [$DEFAULT_INSTALL_DIR]: " user_install_dir
    if [ -z "$user_install_dir" ]; then
        # User pressed Enter, use default
        INSTALL_DIR="$DEFAULT_INSTALL_DIR"
    else
        # User provided a path
        INSTALL_DIR="$user_install_dir"
    fi
else
    # Non-interactive (curl piped to bash), use default
    echo "Using default installation directory for non-interactive install."
    INSTALL_DIR="$DEFAULT_INSTALL_DIR"
fi

# Make sure it's an absolute path
if [[ "$INSTALL_DIR" != /* ]]; then
    INSTALL_DIR="$PWD/$INSTALL_DIR"
fi

echo "Installing to: $INSTALL_DIR"

# Check if directory already exists
if [ -d "${INSTALL_DIR}" ]; then
    echo "Warning: Directory ${INSTALL_DIR} already exists."
    read -p "Do you want to continue and possibly overwrite existing files? (y/n): " overwrite
    if [[ "$overwrite" != "y" && "$overwrite" != "Y" ]]; then
        echo "Installation cancelled."
        exit 1
    fi
    # Remove the directory to avoid git clone errors
    rm -rf "${INSTALL_DIR}"
fi

# Create the directory
mkdir -p "${INSTALL_DIR}"

# Clone or update the repository
echo "Setting up Quickbase MCP Server repository..."

# Check if .git directory exists (it's already a git repo)
if [ -d "${INSTALL_DIR}/.git" ]; then
    # It's already a git repo, just pull the latest changes
    echo "Repository already exists, updating it..."
    (cd "${INSTALL_DIR}" && git pull)
else
    # Fresh clone
    echo "Cloning the repository..."
    git clone https://github.com/danielbushman/mcp-quickbase.git "${INSTALL_DIR}"
fi

if [ $? -ne 0 ]; then
    echo "Failed to set up repository. Please check your internet connection and try again."
    exit 1
fi

echo "Repository setup completed successfully."

# Change to the installation directory
cd "${INSTALL_DIR}" || { echo "Failed to change to installation directory"; exit 1; }

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Build the TypeScript project
echo "Building TypeScript project..."
npm run build

# Make scripts executable
echo "Setting up executables..."
chmod +x run_tests.sh
chmod +x configure.sh
chmod +x check_dependencies.sh

# Full and complete path now stored in INSTALL_DIR
# Use current directory for certainty
CURRENT_DIR=$(pwd)

echo
echo "======================================================"
echo "    Environment Setup Complete! 🎉"
echo "======================================================"
echo
echo "The Quickbase MCP Server has been installed to:"
echo "$CURRENT_DIR"
echo
echo "Next steps:"
echo "1. Run the configuration script to set up your credentials:"
echo "   cd \"$CURRENT_DIR\" && ./configure.sh"
echo
echo "For more information, see the README.md in the installation directory"
echo "======================================================"