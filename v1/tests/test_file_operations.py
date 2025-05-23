#!/usr/bin/env python3
"""
Test script for Quickbase file operations.
This script demonstrates how to use the Quickbase MCP tools for file operations.

Required environment variables:
    - QUICKBASE_TABLE_ID: The ID of a Quickbase table with a file attachment field
    - QUICKBASE_RECORD_ID: The ID of a record in the table
    - QUICKBASE_FILE_FIELD_ID: The ID of a file attachment field in the table
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from src.quickbase.server import handle_call_tool

async def test_file_operations():
    """Test the file upload and download operations for Quickbase."""
    # Load environment variables
    load_dotenv()

    print("\n=== Testing Quickbase File Operations ===\n")

    # Get Quickbase IDs from environment variables
    table_id = os.getenv("QUICKBASE_TABLE_ID")
    record_id = os.getenv("QUICKBASE_RECORD_ID")
    field_id = os.getenv("QUICKBASE_FILE_FIELD_ID")

    if not all([table_id, record_id, field_id]):
        print("ERROR: Missing required environment variables.")
        print("Please set QUICKBASE_TABLE_ID, QUICKBASE_RECORD_ID, and QUICKBASE_FILE_FIELD_ID")
        return False

    print("Test configuration:")
    print(f"- Table ID: {table_id}")
    print(f"- Record ID: {record_id}")
    print(f"- Field ID: {field_id}")

    all_tests_passed = True
    test_file_path = None
    download_path = None

    try:
        # Create a temporary test file to upload
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as temp:
            temp.write(b"This is a test file for Quickbase file operations.")
            test_file_path = temp.name

        print(f"\nCreated test file at: {test_file_path}")

        # 1. Upload file
        print("\n1. Testing upload_file...")
        try:
            upload_args = {
                "table_id": table_id,
                "record_id": record_id,
                "field_id": field_id,
                "file_path": test_file_path
            }
            result = await handle_call_tool("upload_file", upload_args)
            for content in result:
                print(content.text)
            print("✅ File upload test passed")
        except Exception as e:
            print(f"❌ Error uploading file: {e}")
            all_tests_passed = False

        # 2. Download file
        print("\n2. Testing download_file...")
        try:
            download_path = os.path.join(tempfile.gettempdir(), "quickbase_download_test.txt")
            download_args = {
                "table_id": table_id,
                "record_id": record_id,
                "field_id": field_id,
                "version": "0",  # Latest version
                "output_path": download_path
            }
            result = await handle_call_tool("download_file", download_args)
            for content in result:
                print(content.text)

            # Verify downloaded file contents
            if os.path.exists(download_path):
                with open(download_path, 'r') as f:
                    content = f.read()
                    print(f"Downloaded file contents: {content}")
                print("✅ File download test passed")
            else:
                print("❌ Download file not found")
                all_tests_passed = False
        except Exception as e:
            print(f"❌ Error downloading file: {e}")
            all_tests_passed = False

    finally:
        # Clean up test files
        for path in [test_file_path, download_path]:
            if path and os.path.exists(path):
                os.unlink(path)
                print(f"Cleaned up temporary file: {path}")

    print("\n=== File Operations Testing Complete ===")
    if all_tests_passed:
        print("All file operation tests passed successfully!")
    else:
        print("Some file operation tests failed. Check the logs above for details.")

    return all_tests_passed

if __name__ == "__main__":
    success = asyncio.run(test_file_operations())
    sys.exit(0 if success else 1)