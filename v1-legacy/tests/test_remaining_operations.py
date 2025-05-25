#!/usr/bin/env python3
"""
Test script for the remaining Quickbase operations.
This script tests create_record, update_record, and query_records operations.

Required environment variables:
    - QUICKBASE_TABLE_ID: The ID of a Quickbase table for testing
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
import sys
# Handle the module import issue
sys.path.append(str(Path(__file__).resolve().parent.parent / "src" / "quickbase"))
from src.quickbase.server import handle_call_tool

async def test_record_operations():
    """Test the record operations tools (create_record, update_record, query_records)."""
    # Load environment variables
    load_dotenv()
    
    print("\n=== Testing Quickbase Record Operations ===\n")
    
    # Get Quickbase table ID from environment variable
    table_id = os.getenv("QUICKBASE_TABLE_ID")
    
    if not table_id:
        print("ERROR: Missing required environment variable QUICKBASE_TABLE_ID")
        return False
    
    print(f"Using table: {table_id}\n")
    
    # Generate a unique identifier for testing
    test_id = str(uuid.uuid4())[:8]
    print(f"Test run ID: {test_id}")
    
    all_tests_passed = True
    record_id = None
    
    # 1. Create a record
    print("\n1. Testing record creation...")
    try:
        # Create a simple record - adjust field IDs as needed for your table
        create_data = {
            "6": {"value": f"Test Record {test_id}"},  # Assuming field 6 is a text field
            "7": {"value": "Created by test script"}   # Assuming field 7 is a text field
        }
        
        create_args = {
            "table_id": table_id,
            "data": json.dumps(create_data)
        }
        
        result = await handle_call_tool("create_record", create_args)
        for content in result:
            print(content.text)
            # Try to extract the record ID from the result
            try:
                result_data = json.loads(content.text.split('\n', 1)[1])
                if "metadata" in result_data and "createdRecordIds" in result_data["metadata"]:
                    record_id = result_data["metadata"]["createdRecordIds"][0]
                    print(f"Created record ID: {record_id}")
            except Exception:
                pass
        
        if record_id:
            print("✅ Record creation test passed")
        else:
            print("❌ Could not extract record ID from response")
            all_tests_passed = False
            
    except Exception as e:
        print(f"❌ Error creating record: {e}")
        all_tests_passed = False
    
    # 2. Update the record if we have a record_id
    if record_id:
        print("\n2. Testing record update...")
        try:
            # Update the record
            update_data = {
                "7": {"value": "Updated by test script"}  # Assuming field 7 is a text field
            }
            
            update_args = {
                "table_id": table_id,
                "record_id": record_id,
                "data": update_data
            }
            
            result = await handle_call_tool("update_record", update_args)
            for content in result:
                print(content.text)
                
            print("✅ Record update test passed")
        except Exception as e:
            print(f"❌ Error updating record: {e}")
            all_tests_passed = False
    
        # 3. Query records to verify our changes
        print("\n3. Testing record query to verify changes...")
        try:
            query_args = {
                "table_id": table_id,
                "select": ["3", "6", "7"],  # Adjust field IDs as needed
                "where": f"{{3.EX.'{record_id}'}}",  # Filter by our record ID
                "options": {
                    "top": 10  # Get up to 10 records
                }
            }
            
            result = await handle_call_tool("query_records", query_args)
            for content in result:
                print(content.text.split('\n', 3)[0])  # Just print the summary line
                print("(Full results omitted)")
                
            print("✅ Record query test passed")
        except Exception as e:
            print(f"❌ Error querying records: {e}")
            all_tests_passed = False
    
    print("\n=== Record Operations Testing Complete ===")
    if all_tests_passed:
        print("All record operations tests passed successfully!")
    else:
        print("Some record operations tests failed. Check the logs above for details.")
    
    return all_tests_passed

if __name__ == "__main__":
    success = asyncio.run(test_record_operations())
    sys.exit(0 if success else 1)