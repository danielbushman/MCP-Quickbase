#!/usr/bin/env python3
"""
Test script for the create_record functionality in the Quickbase MCP integration.
This script tests creating records with different data structures and error handling.

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
from src.quickbase.server import handle_call_tool

async def test_create_record():
    """Test the create_record functionality with various data inputs and error conditions."""
    # Load environment variables
    load_dotenv()

    print("\n=== Testing Quickbase Record Creation ===\n")

    # Get Quickbase table ID from environment variable
    table_id = os.getenv("QUICKBASE_TABLE_ID")
    if not table_id:
        print("Error: QUICKBASE_TABLE_ID environment variable is not set")
        return False

    print(f"Using table: {table_id}\n")

    # Generate a unique identifier for this test run
    test_id = str(uuid.uuid4())[:8]
    print(f"Test run ID: {test_id}")

    all_tests_passed = True

    # Test 1: Create a simple record with a string and number field
    print("\n1. Testing simple record creation...")
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

        if record_id:
            print("✅ Simple record creation test passed")
        else:
            print("❌ Could not extract record ID from response")
            all_tests_passed = False

        # Test 2: Create a record with complex data structure
        print("\n2. Testing complex record creation...")
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

        print("✅ Complex record creation test passed")

        # Test 3: Test error handling with invalid data
        print("\n3. Testing error handling - invalid JSON data...")
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
                    print("✅ Successfully detected invalid JSON error")
                    break

            if not error_found:
                print("❌ Failed to detect invalid JSON data")
                all_tests_passed = False

        except Exception as e:
            print(f"✅ Successfully caught invalid JSON error: {str(e)}")

        # Test 4: Test error handling with missing table_id
        print("\n4. Testing error handling - missing table_id...")
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
                    print("✅ Successfully detected missing table_id error")
                    break

            if not error_found:
                print("❌ Failed to detect missing table_id")
                all_tests_passed = False

        except Exception as e:
            print(f"✅ Successfully caught missing table_id error: {str(e)}")

        print("\n=== Record Creation Testing Complete ===")
        if all_tests_passed:
            print("All record creation tests passed successfully!")
        else:
            print("Some record creation tests failed. Check the logs above for details.")

        return all_tests_passed

    except Exception as e:
        print(f"\n❌ Error testing create_record: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_create_record())
    sys.exit(0 if success else 1)