#!/usr/bin/env python3
"""
Test script for table operations in the Quickbase MCP integration.
This script tests create_table and update_table operations.
"""

import asyncio
import json
import os
import sys
import uuid
from pathlib import Path

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from src.quickbase.server import handle_call_tool

async def test_table_operations():
    """Test the table operations tools (create_table and update_table)."""
    # Load environment variables
    load_dotenv()
    
    # Get Quickbase app ID from environment variable
    app_id = os.getenv("QUICKBASE_APP_ID")
    if not app_id:
        print("Error: QUICKBASE_APP_ID environment variable is not set")
        return False
    
    print(f"Testing table operations on app: {app_id}\n")
    
    # Generate a unique identifier for this test run
    test_id = str(uuid.uuid4())[:8]
    
    # Test 1: Create a new table
    print("Test 1: Creating a new table")
    table_name = f"Test Table {test_id}"
    
    try:
        result = await handle_call_tool("create_table", {
            "app_id": app_id,
            "name": table_name,
            "description": "Table created during testing",
            "fields": [
                {
                    "name": "Name",
                    "type": "text",
                    "description": "Test name field"
                },
                {
                    "name": "Description",
                    "type": "text",
                    "description": "Test description field"
                },
                {
                    "name": "Value",
                    "type": "numeric",
                    "description": "Test numeric field"
                }
            ]
        })
        
        # Print the result
        for content in result:
            print(content.text)
        
        # Try to extract the table ID
        new_table_id = None
        for content in result:
            try:
                if "Table created successfully" in content.text or "Create Table Result" in content.text:
                    # Try to find the table ID in the response
                    lines = content.text.split('\n')
                    for line in lines:
                        if "id" in line.lower():
                            parts = line.split(":")
                            if len(parts) > 1:
                                potential_id = parts[1].strip().strip('",').strip('"')
                                if potential_id.startswith("b"):
                                    new_table_id = potential_id
                                    break
            except Exception as e:
                print(f"Error extracting table ID: {str(e)}")
        
        if new_table_id:
            print(f"Successfully created table with ID: {new_table_id}\n")
            
            # Test 2: Update the table
            print("Test 2: Updating the table")
            updated_table_name = f"Updated Table {test_id}"
            
            result = await handle_call_tool("update_table", {
                "table_id": new_table_id,
                "name": updated_table_name,
                "description": "Table updated during testing"
            })
            
            # Print the result
            for content in result:
                print(content.text)
                
            print("Table update test completed.\n")
            
            # Test 3: Create a field in the table
            print("Test 3: Creating a new field in the table")
            
            result = await handle_call_tool("create_field", {
                "table_id": new_table_id,
                "field_name": f"Test Field {test_id}",
                "field_type": "text",
                "options": {} # Simplify options to avoid API issues
            })
            
            # Print the result
            for content in result:
                print(content.text)
                
            print("Field creation test completed.\n")
        else:
            print("Error: Could not extract table ID from response.")
            
        print("All table operations tests completed!")
        return True
        
    except Exception as e:
        print(f"Error testing table operations: {str(e)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_table_operations())
    sys.exit(0 if result else 1)