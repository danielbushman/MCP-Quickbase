#!/bin/bash

# Quickbase MCP Server v2 Dependency Checker
# This script checks for required dependencies for the TypeScript-based v2

# Initialize dependency flags
git_ok=false
node_ok=false
auto_install=false

# Check for macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only."
    echo "Please install dependencies manually for your operating system."
    exit 1
fi

echo "✅ Detected macOS"
echo "🔍 Checking dependencies for Quickbase MCP Server v2..."

# Ask user if they want to try auto-installing missing dependencies
ask_for_auto_install() {
    read -p "Would you like to attempt to automatically install missing dependencies? (y/n): " answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
        auto_install=true
        echo "Auto-install enabled. Will attempt to install missing dependencies."
    else
        echo "Auto-install disabled. You will need to install dependencies manually."
    fi
}

# Check if Homebrew is installed (needed for auto-installation)
check_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is required for auto-installation but was not found."
        echo "Would you like to install Homebrew?"
        read -p "(y/n): " install_brew
        if [[ "$install_brew" == "y" || "$install_brew" == "Y" ]]; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            
            # Check if Homebrew was installed successfully
            if command -v brew &> /dev/null; then
                echo "✅ Homebrew installed successfully."
                return 0
            else
                echo "❌ Failed to install Homebrew."
                return 1
            fi
        else
            echo "Please install Homebrew manually if you want to use auto-installation."
            return 1
        fi
    fi
    return 0
}

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed."
    
    if [ "$auto_install" = true ]; then
        if check_homebrew; then
            echo "Attempting to install Git..."
            brew install git
            if command -v git &> /dev/null; then
                echo "✅ Git installed successfully."
                git_ok=true
            else
                echo "❌ Failed to install Git."
            fi
        fi
    else
        echo "Please install Git before running auto_setup.sh."
    fi
else
    echo "✅ Git is installed."
    git_ok=true
fi

# Note: Python is no longer required for v2 (TypeScript-based)

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    
    if [ "$auto_install" = true ]; then
        if check_homebrew; then
            echo "Attempting to install Node.js 18 or higher..."
            brew install node@20
            # Try to link the new Node.js version
            brew link --force --overwrite node@20
            
            if command -v node &> /dev/null; then
                node_version=$(node --version | cut -c 2-)
                echo "✅ Node.js $node_version installed successfully."
                node_ok=true
            else
                echo "❌ Failed to install Node.js."
            fi
        fi
    else
        echo "Please install Node.js 18 or higher for v2."
    fi
else
    node_version=$(node --version | cut -c 2-)
    node_major=$(echo $node_version | cut -d. -f1)

    echo "🔍 Detected Node.js version: $node_version"

    if [ "$node_major" -lt 18 ]; then
        echo "❌ Node.js 18 or higher is required for v2. Found Node.js $node_version"
        
        if [ "$auto_install" = true ]; then
            if check_homebrew; then
                echo "Attempting to upgrade Node.js..."
                brew upgrade node || brew install node@20
                # Try to link the new Node.js version
                brew link --force --overwrite node@20
                
                node_version=$(node --version | cut -c 2-)
                node_major=$(echo $node_version | cut -d. -f1)
                
                if [ "$node_major" -ge 18 ]; then
                    echo "✅ Node.js $node_version installed successfully."
                    node_ok=true
                else
                    echo "❌ Failed to install Node.js 18 or higher."
                fi
            fi
        else
            echo "Please upgrade Node.js to version 18 or higher."
        fi
    else
        echo "✅ Node.js version is compatible."
        node_ok=true
    fi
fi

# First check if all dependencies are already satisfied
if [ "$git_ok" = true ] && [ "$node_ok" = true ]; then
    echo ""
    echo "✅ All dependencies are satisfied!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Clone the repository:"
    echo "   git clone https://github.com/danielbushman/quickbase-mcp-connector.git"
    echo "2. Install dependencies:"
    echo "   cd quickbase-mcp-connector && npm install"
    echo "3. Build the project:"
    echo "   npm run build"
    echo "4. Configure Claude Desktop with the path to:"
    echo "   $(pwd)/quickbase-mcp-connector/dist/mcp-stdio-server.js"
    exit 0
else
    # If not all dependencies are satisfied, offer to auto-install if not already enabled
    if [ "$auto_install" = false ]; then
        ask_for_auto_install
        # Recursive call to the script itself, now with auto_install enabled if the user agreed
        if [ "$auto_install" = true ]; then
            exec $0
        fi
    else
        # If we get here, auto-install was enabled but some dependencies still couldn't be installed
        echo ""
        echo "❌ Not all dependencies could be automatically installed."
        echo "Please install the missing dependencies manually and try again."
        exit 1
    fi
fi