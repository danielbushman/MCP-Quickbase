#!/bin/bash
# Test script for Quickbase MCP integration

echo "Starting Quickbase MCP Integration Tests"
echo "========================================"
echo

# Check for .env file
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file from the .env.example template."
    exit 1
fi

# Run the connection test
echo "1. Testing connection..."
python tests/test_connection.py
if [ $? -ne 0 ]; then
    echo "Connection test failed. Please check your Quickbase credentials."
    exit 1
fi
echo

# Run record operations test
echo "2. Testing record operations..."
python tests/test_remaining_operations.py
echo

# Check if required variables for file operations exist
source .env
if [ -z "$QUICKBASE_TABLE_ID" ] || [ -z "$QUICKBASE_RECORD_ID" ] || [ -z "$QUICKBASE_FILE_FIELD_ID" ]; then
    echo "3. File operations test skipped (missing environment variables)"
    echo "   To run file operations tests, set QUICKBASE_TABLE_ID, QUICKBASE_RECORD_ID, and QUICKBASE_FILE_FIELD_ID"
else
    echo "3. Testing file operations..."
    python tests/test_file_operations.py
    echo
fi

# Run pagination test if table ID exists
if [ -z "$QUICKBASE_TABLE_ID" ]; then
    echo "4. Pagination test skipped (missing QUICKBASE_TABLE_ID)"
else
    echo "4. Testing pagination..."
    python tests/test_pagination.py
    echo
fi

# Run create record test if table ID exists
if [ -z "$QUICKBASE_TABLE_ID" ]; then
    echo "5. Create record test skipped (missing QUICKBASE_TABLE_ID)"
else
    echo "5. Testing record creation..."
    python tests/test_create_record.py
    echo
fi

echo "All tests completed!"