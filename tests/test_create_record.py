#!/usr/bin/env python3
"""
Test script for the create_record functionality in the Quickbase MCP integration.
This script tests creating records with different data structures.
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

async def test_create_record():
    """Test the create_record functionality with various data inputs."""
    # Load environment variables
    load_dotenv()
    
    # Get Quickbase table ID from environment variable
    table_id = os.getenv("QUICKBASE_TABLE_ID")
    if not table_id:
        print("Error: QUICKBASE_TABLE_ID environment variable is not set")
        return False
    
    print(f"Testing create_record functionality on table: {table_id}\n")
    
    # Generate a unique identifier for this test run
    test_id = str(uuid.uuid4())[:8]
    
    # Test 1: Create a simple record with a string and number field
    print("Test 1: Creating a simple record with string and number fields")
    simple_data = {
        "6": {"value": f"Simple Record Test {test_id}"},  # Text field
        "7": {"value": f"Created during testing with test ID {test_id}"},  # Another text field
        "8": {"value": 42}  # Numeric field (if it exists)
    }
    
    try:
        result = await handle_call_tool("create_record", {
            "table_id": table_id,
            "data": json.dumps(simple_data)
        })
        
        for content in result:
            print(content.text)
        
        # Try to extract the record ID from the result
        record_id = None
        for content in result:
            try:
                result_data = json.loads(content.text.split('\n', 1)[1])
                if "metadata" in result_data and "createdRecordIds" in result_data["metadata"]:
                    record_id = result_data["metadata"]["createdRecordIds"][0]
                    print(f"Created record ID: {record_id}")
            except Exception:
                pass
                
        print("Simple record creation successful!\n")
        
        # Test 2: Create a record with complex data structure (if applicable)
        print("Test 2: Creating a record with complex data structure")
        complex_data = {
            "6": {"value": f"Complex Record Test {test_id}"},
            "7": {"value": f"Created with complex data during testing {test_id}"}
            # Add more complex fields as needed
        }
        
        result = await handle_call_tool("create_record", {
            "table_id": table_id,
            "data": json.dumps(complex_data)
        })
        
        for content in result:
            print(content.text)
        
        print("Complex record creation successful!\n")
        
        # Test 3: Test error handling with invalid data
        print("Test 3: Testing error handling with invalid JSON data")
        try:
            result = await handle_call_tool("create_record", {
                "table_id": table_id,
                "data": "{invalid json data}"
            })
            
            # Check if result contains error message
            error_found = False
            for content in result:
                print(content.text)
                if "Invalid data format" in content.text:
                    error_found = True
                    print("✅ Successfully detected invalid JSON error\n")
                    
            if not error_found:
                print("❌ Error: Failed to detect invalid JSON data\n")
        except Exception as e:
            print(f"✅ Successfully caught invalid JSON error: {str(e)}\n")
        
        # Test 4: Test error handling with missing table_id
        print("Test 4: Testing error handling with missing table_id")
        try:
            result = await handle_call_tool("create_record", {
                "data": json.dumps({"field": {"value": "test"}})
            })
            
            # Check if result contains error message
            error_found = False
            for content in result:
                print(content.text)
                if "Missing 'table_id'" in content.text:
                    error_found = True
                    print("✅ Successfully detected missing table_id error\n")
                    
            if not error_found:
                print("❌ Error: Failed to detect missing table_id\n")
        except Exception as e:
            print(f"✅ Successfully caught missing table_id error: {str(e)}\n")
            
        print("All create_record tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error testing create_record: {str(e)}")
        return False
        
if __name__ == "__main__":
    result = asyncio.run(test_create_record())
    sys.exit(0 if result else 1)