#!/usr/bin/env python3
"""
Test script for the remaining Quickbase operations.
This script tests create_record and update_record operations.
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

async def test_record_operations():
    """Test the record operations tools."""
    # Load environment variables
    load_dotenv()
    
    # Get Quickbase table ID from environment variable
    TABLE_ID = os.getenv("QUICKBASE_TABLE_ID")
    
    if not TABLE_ID:
        print("ERROR: Missing required environment variable QUICKBASE_TABLE_ID")
        return
    
    print(f"Testing Quickbase record operations on table: {TABLE_ID}\n")
    
    # 1. Create a record
    print("1. Testing create_record...")
    record_id = None
    try:
        # Generate a unique identifier for testing
        test_id = str(uuid.uuid4())[:8]
        
        # Create a simple record - adjust field IDs as needed for your table
        create_data = {
            "6": {"value": f"Test Record {test_id}"},  # Assuming field 6 is a text field
            "7": {"value": "Created by test script"}   # Assuming field 7 is a text field
        }
        
        create_args = {
            "table_id": TABLE_ID,
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
    except Exception as e:
        print(f"Error creating record: {e}")
    
    # 2. Update the record if we have a record_id
    if record_id:
        print("\n2. Testing update_record...")
        try:
            # Update the record
            update_data = {
                "7": {"value": "Updated by test script"}  # Assuming field 7 is a text field
            }
            
            update_args = {
                "table_id": TABLE_ID,
                "record_id": record_id,
                "data": update_data
            }
            
            result = await handle_call_tool("update_record", update_args)
            for content in result:
                print(content.text)
        except Exception as e:
            print(f"Error updating record: {e}")
    
    # 3. Query records to verify our changes
    print("\n3. Testing query_records to verify changes...")
    try:
        query_args = {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],  # Adjust field IDs as needed
            "where": record_id and f"{{3.EX.'{record_id}'}}" or "",  # Filter by our record ID if available
            "options": {
                "top": 10  # Get up to 10 records
            }
        }
        
        result = await handle_call_tool("query_records", query_args)
        for content in result:
            print(content.text.split('\n', 3)[0])  # Just print the summary line
            print("(Full results omitted)")
    except Exception as e:
        print(f"Error querying records: {e}")
    
    print("\nRecord operations testing complete.")

if __name__ == "__main__":
    asyncio.run(test_record_operations())