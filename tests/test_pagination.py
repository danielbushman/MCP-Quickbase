#!/usr/bin/env python3
"""
Test script for Quickbase pagination.
This script demonstrates how to use pagination for large result sets.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from src.quickbase.server import handle_call_tool

async def test_pagination():
    """Test the pagination functionality."""
    # Load environment variables
    load_dotenv()
    
    # Get Quickbase table ID from environment variable
    TABLE_ID = os.getenv("QUICKBASE_TABLE_ID")
    
    if not TABLE_ID:
        print("ERROR: Missing required environment variable QUICKBASE_TABLE_ID")
        return
    
    print(f"Testing Quickbase pagination on table: {TABLE_ID}\n")
    
    # 1. Regular query without pagination
    print("\n1. Testing query without pagination...")
    try:
        query_args = {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],  # Adjust field IDs as needed
            "where": "",  # No filtering
            "options": {
                "top": 100  # Get up to 100 records
            }
        }
        result = await handle_call_tool("query_records", query_args)
        for content in result:
            # Show only the summary, not the full results
            lines = content.text.split('\n')
            print('\n'.join(lines[:3]))
            print("(Full results omitted)")
    except Exception as e:
        print(f"Error with regular query: {e}")
    
    # 2. Query with pagination
    print("\n2. Testing query with pagination...")
    try:
        paginated_query_args = {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],  # Adjust field IDs as needed
            "where": "",  # No filtering
            "options": {
                "top": 50  # Page size of 50
            },
            "paginate": True,
            "max_records": 200  # Get up to 200 records total
        }
        result = await handle_call_tool("query_records", paginated_query_args)
        for content in result:
            # Show only the summary, not the full results
            lines = content.text.split('\n')
            print('\n'.join(lines[:3]))
            print("(Full results omitted)")
    except Exception as e:
        print(f"Error with paginated query: {e}")
    
    # 3. Test pagination with filtering
    print("\n3. Testing pagination with filtering...")
    try:
        filtered_query_args = {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],  # Adjust field IDs as needed
            "where": "{6.EX.'Active'}",  # Example filter - adjust as needed
            "options": {
                "top": 25,  # Smaller page size
                "orderBy": [
                    {
                        "fieldId": 3,
                        "order": "DESC"
                    }
                ]
            },
            "paginate": True,
            "max_records": 75  # Get up to 75 records
        }
        result = await handle_call_tool("query_records", filtered_query_args)
        for content in result:
            # Show only the summary, not the full results
            lines = content.text.split('\n')
            print('\n'.join(lines[:3]))
            print("(Full results omitted)")
    except Exception as e:
        print(f"Error with filtered pagination query: {e}")
    
    print("\nPagination testing complete.")

if __name__ == "__main__":
    asyncio.run(test_pagination())