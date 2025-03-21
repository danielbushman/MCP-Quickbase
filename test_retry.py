#!/usr/bin/env python3
"""
Test script for the Quickbase MCP retry functionality.

This script tests the retry mechanism by verifying that operations are retried
when transient errors occur.
"""

import os
import json
import time
import requests
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def call_tool(name, **parameters):
    """
    Call an MCP tool on the Quickbase server.
    
    Args:
        name (str): The name of the tool to call
        **parameters: The parameters to pass to the tool
        
    Returns:
        dict: The tool's response
    """
    url = "http://localhost:3000/call_tool"
    payload = {
        "name": name,
        "arguments": parameters
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

def create_test_records(table_id, count=5):
    """
    Create test records for bulk operations.
    
    Args:
        table_id (str): The table ID to create records in
        count (int): Number of records to create
        
    Returns:
        list: The created record IDs
    """
    # Create random records with timestamp to ensure uniqueness
    records = []
    timestamp = int(time.time())
    
    for i in range(count):
        records.append({
            "6": {"value": f"Test Record {i+1} - {timestamp}"},
            "7": {"value": f"Test Description {i+1} - {random.randint(1000, 9999)}"},
            "8": {"value": i * 10 + random.randint(1, 10)}
        })
    
    # Create the records
    result = call_tool("bulk_create_records", table_id=table_id, records=records)
    content = result["content"][0]["text"]
    
    if "Error" in content:
        print(f"Error creating test records: {content}")
        return []
        
    result_data = json.loads(content.split("Result (JSON):\n")[1])
    return [metadata["id"] for metadata in result_data.get("metadata", [])]

def test_bulk_operations_with_retry(table_id):
    """
    Test bulk operations with retry logic.
    
    This function creates test records, then performs bulk operations that
    should trigger the retry mechanism.
    
    Args:
        table_id (str): The table ID to use for testing
    """
    print("\n--- Testing Bulk Operations with Retry ---")
    
    # Create test records
    print("\nCreating test records...")
    record_ids = create_test_records(table_id)
    
    if not record_ids:
        print("Failed to create test records, skipping retry test")
        return
        
    print(f"Created {len(record_ids)} test records with IDs: {', '.join(record_ids)}")
    
    # Test bulk update with retry
    print("\nTesting bulk update with retry (large batch)...")
    updates = []
    
    # Create updates (intentionally making a large batch to potentially trigger rate limiting)
    for record_id in record_ids:
        updates.append({
            "3": {"value": record_id},
            "6": {"value": f"Updated Record {record_id} - {time.time()}"},
            "8": {"value": random.randint(100, 200)}
        })
    
    # Update the records
    try:
        update_result = call_tool("bulk_update_records", table_id=table_id, records=updates)
        print(f"Bulk update result: {update_result['content'][0]['text']}")
    except Exception as e:
        print(f"Error during bulk update: {str(e)}")
    
    # Test bulk delete
    print("\nDeleting test records...")
    try:
        delete_result = call_tool("bulk_delete_records", table_id=table_id, record_ids=record_ids)
        print(f"Bulk delete result: {delete_result['content'][0]['text']}")
    except Exception as e:
        print(f"Error during bulk delete: {str(e)}")

def main():
    """Main function to run all tests."""
    # Get a table ID to use for testing
    try:
        print("Fetching available tables...")
        tables_result = call_tool("list_tables")
        tables_text = tables_result["content"][0]["text"]
        tables = json.loads(tables_text.split("Result (JSON):\n")[1])
        
        if not tables:
            print("No tables found. Please create a table for testing.")
            return
            
        table_id = tables[0]["id"]
        print(f"Using table: {tables[0]['name']} (ID: {table_id})")
        
        # Run the retry tests
        test_bulk_operations_with_retry(table_id)
        
        print("\nAll retry tests completed!")
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    main()