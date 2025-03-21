#!/usr/bin/env python3
"""
Test script for Quickbase file operations.
This script demonstrates how to use the Quickbase MCP tools for file operations.

Usage:
    1. Ensure you have the following environment variables set:
        - QUICKBASE_TABLE_ID: The ID of a Quickbase table with a file attachment field
        - QUICKBASE_RECORD_ID: The ID of a record in the table
        - QUICKBASE_FILE_FIELD_ID: The ID of a file attachment field in the table
    2. Run the script: python test_file_operations.py
"""

import asyncio
import os
import tempfile
from dotenv import load_dotenv
from src.quickbase.server import handle_call_tool

async def test_file_operations():
    """Test the file operations tools."""
    # Load environment variables
    load_dotenv()
    
    # Get Quickbase IDs from environment variables or use defaults
    TABLE_ID = os.getenv("QUICKBASE_TABLE_ID")
    RECORD_ID = os.getenv("QUICKBASE_RECORD_ID")
    FIELD_ID = os.getenv("QUICKBASE_FILE_FIELD_ID")
    
    if not all([TABLE_ID, RECORD_ID, FIELD_ID]):
        print("ERROR: Missing required environment variables.")
        print("Please set QUICKBASE_TABLE_ID, QUICKBASE_RECORD_ID, and QUICKBASE_FILE_FIELD_ID")
        return
    
    print("Testing Quickbase file operations...\n")
    print(f"Using TABLE_ID: {TABLE_ID}")
    print(f"Using RECORD_ID: {RECORD_ID}")
    print(f"Using FIELD_ID: {FIELD_ID}")
    
    # Create a temporary test file to upload
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as temp:
        temp.write(b"This is a test file for Quickbase file operations.")
        test_file_path = temp.name
    
    print(f"Created test file at: {test_file_path}")
    
    # 1. Upload file
    print("\n1. Testing upload_file...")
    try:
        upload_args = {
            "table_id": TABLE_ID,
            "record_id": RECORD_ID,
            "field_id": FIELD_ID,
            "file_path": test_file_path
        }
        result = await handle_call_tool("upload_file", upload_args)
        for content in result:
            print(content.text)
    except Exception as e:
        print(f"Error uploading file: {e}")
    
    # 2. Download file
    print("\n2. Testing download_file...")
    try:
        download_path = os.path.join(tempfile.gettempdir(), "quickbase_download_test.txt")
        download_args = {
            "table_id": TABLE_ID,
            "record_id": RECORD_ID,
            "field_id": FIELD_ID,
            "version": "0",  # Latest version
            "output_path": download_path
        }
        result = await handle_call_tool("download_file", download_args)
        for content in result:
            print(content.text)
        
        # Show downloaded file contents
        if os.path.exists(download_path):
            with open(download_path, 'r') as f:
                print(f"Downloaded file contents: {f.read()}")
    except Exception as e:
        print(f"Error downloading file: {e}")
    
    # 3. Delete file
    print("\n3. Testing delete_file...")
    try:
        delete_args = {
            "table_id": TABLE_ID,
            "record_id": RECORD_ID,
            "field_id": FIELD_ID,
            "version": "0"  # Latest version
        }
        result = await handle_call_tool("delete_file", delete_args)
        for content in result:
            print(content.text)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Clean up the test file
    if os.path.exists(test_file_path):
        os.unlink(test_file_path)
    if os.path.exists(download_path):
        os.unlink(download_path)
    
    print("\nFile operations testing complete.")

if __name__ == "__main__":
    asyncio.run(test_file_operations())