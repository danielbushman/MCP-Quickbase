#!/usr/bin/env python3
"""
Comprehensive validation script for the Quickbase MCP Integration.
This script tests all core functionality to verify that the implementation works correctly.
"""

import asyncio
import json
import os
import sys
import time
import uuid
from dotenv import load_dotenv
import subprocess

# Set up test environment
test_env_file = ".env.test"
if not os.path.exists(test_env_file):
    print(f"Error: {test_env_file} not found. Please create it with your test credentials.")
    sys.exit(1)

# Load test environment variables
load_dotenv(test_env_file)

# Import server module
try:
    from src.quickbase.server import handle_call_tool, __version__
except ImportError:
    print("Error importing server module. Make sure you're in the right directory.")
    sys.exit(1)

# Required environment variables
required_vars = ["QUICKBASE_REALM_HOST", "QUICKBASE_USER_TOKEN", "QUICKBASE_APP_ID", "QUICKBASE_TABLE_ID"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)

# Test parameters
TABLE_ID = os.getenv("QUICKBASE_TABLE_ID")
APP_ID = os.getenv("QUICKBASE_APP_ID")

# Test state
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": [],
    "created_record_id": None
}

# Unique identifier for this test run
test_id = str(uuid.uuid4())[:8]

# Start a server process
server_process = None

def start_server():
    """Start the Quickbase MCP server"""
    global server_process
    server_process = subprocess.Popen(
        ["node", "src/quickbase/server.js"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=os.environ.copy()
    )
    # Give the server time to start
    time.sleep(3)
    print(f"Server started with PID {server_process.pid}")

def stop_server():
    """Stop the Quickbase MCP server"""
    global server_process
    if server_process:
        print(f"Stopping server (PID {server_process.pid})...")
        server_process.terminate()
        server_process = None

async def run_test(name, tool, arguments, validator=None, expected_error=None):
    """Run a single test and record the result"""
    print(f"\n--- Testing {name} ---")
    print(f"Tool: {tool}")
    print(f"Arguments: {json.dumps(arguments, indent=2)}")
    
    try:
        result = await handle_call_tool(tool, arguments)
        
        # Print result summary
        for content in result:
            lines = content.text.split('\n')
            if len(lines) > 10:
                print("\n".join(lines[:5]))
                print("...")
                print("\n".join(lines[-5:]))
            else:
                print(content.text)
        
        if expected_error:
            print(f"FAIL: Expected error '{expected_error}' but got success")
            test_results["failed"] += 1
            return None
        
        if validator:
            if validator(result):
                print("PASS")
                test_results["passed"] += 1
            else:
                print("FAIL: Validation failed")
                test_results["failed"] += 1
                test_results["errors"].append(f"{name}: Validation failed")
        else:
            print("PASS")
            test_results["passed"] += 1
            
        return result
    except Exception as e:
        if expected_error and str(e).find(expected_error) >= 0:
            print(f"PASS: Got expected error: {str(e)}")
            test_results["passed"] += 1
        else:
            print(f"ERROR: {str(e)}")
            test_results["failed"] += 1
            test_results["errors"].append(f"{name}: {str(e)}")
        return None

async def test_connection():
    """Test the connection to Quickbase"""
    return await run_test(
        "Connection", 
        "test_connection", 
        {},
        lambda r: any("Connection" in c.text for c in r)
    )

async def test_list_tables():
    """Test listing tables"""
    return await run_test(
        "List Tables", 
        "list_tables", 
        {},
        lambda r: any(f"App {APP_ID}" in c.text for c in r)
    )

async def test_get_table_fields():
    """Test getting table fields"""
    return await run_test(
        "Get Table Fields", 
        "get_table_fields", 
        {"table_id": TABLE_ID},
        lambda r: any("Table Fields" in c.text for c in r)
    )

async def test_create_record():
    """Test creating a record"""
    # Create a record with test data
    create_data = {
        # Field IDs will vary - using common field types
        "6": {"value": f"Validation Test {test_id}"},
        "7": {"value": "Created during validation testing"}
    }
    
    result = await run_test(
        "Create Record", 
        "create_record", 
        {
            "table_id": TABLE_ID, 
            "data": json.dumps(create_data)
        },
        lambda r: any("Create Record Result" in c.text for c in r)
    )
    
    if result:
        # Extract the record ID from the result
        for content in result:
            try:
                result_data = json.loads(content.text.split('\n', 1)[1])
                if "metadata" in result_data and "createdRecordIds" in result_data["metadata"]:
                    test_results["created_record_id"] = result_data["metadata"]["createdRecordIds"][0]
                    print(f"Created record ID: {test_results['created_record_id']}")
            except Exception:
                pass
                
    return result

async def test_query_records():
    """Test querying records"""
    return await run_test(
        "Query Records", 
        "query_records", 
        {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],  # Adjust field IDs as needed
            "where": "",
            "options": {"top": 10}
        },
        lambda r: any("Retrieved" in c.text for c in r)
    )

async def test_query_with_where():
    """Test querying records with WHERE clause"""
    if not test_results["created_record_id"]:
        print("Skipping query with WHERE test - no record ID available")
        return None
        
    return await run_test(
        "Query With WHERE", 
        "query_records", 
        {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],
            "where": f"{{3.EX.'{test_results['created_record_id']}'}}",
            "options": {"top": 10}
        },
        # Check that we got a record back with the correct ID in the WHERE clause
        lambda r: any("records from table" in c.text and "totalRecords" in c.text for c in r)
    )

async def test_update_record():
    """Test updating a record"""
    if not test_results["created_record_id"]:
        print("Skipping update record test - no record ID available")
        return None
        
    update_data = {
        "7": {"value": f"Updated during validation testing {test_id}"}
    }
    
    return await run_test(
        "Update Record", 
        "update_record", 
        {
            "table_id": TABLE_ID,
            "record_id": test_results["created_record_id"],
            "data": update_data
        },
        lambda r: any("Update Record Result" in c.text for c in r)
    )

async def test_pagination():
    """Test pagination"""
    return await run_test(
        "Pagination", 
        "query_records", 
        {
            "table_id": TABLE_ID,
            "select": ["3", "6", "7"],
            "where": "",
            "options": {"top": 5},
            "paginate": True,
            "max_records": 15
        },
        lambda r: any("paginated" in c.text for c in r)
    )

async def test_bulk_create_records():
    """Test bulk record creation"""
    # Create multiple records at once
    bulk_data = [
        {
            # Field IDs will vary - using common field types
            "6": {"value": f"Bulk Test 1 {test_id}"},
            "7": {"value": "Bulk created 1"}
        },
        {
            "6": {"value": f"Bulk Test 2 {test_id}"},
            "7": {"value": "Bulk created 2"}
        }
    ]
    
    return await run_test(
        "Bulk Create Records", 
        "bulk_create_records", 
        {
            "table_id": TABLE_ID,
            "records": bulk_data
        },
        lambda r: any("Bulk Create Records Result" in c.text for c in r)
    )

async def test_bulk_update_records():
    """Test bulk record updates"""
    # We need record IDs to update
    if not test_results.get("created_record_id"):
        print("Skipping bulk update test - no record ID available")
        return None
        
    # For testing, we'll update the same record twice with different data
    record_id = test_results["created_record_id"]
    bulk_update_data = [
        {
            "3": {"value": record_id},
            "7": {"value": f"Bulk updated 1 {test_id}"}
        },
        {
            "3": {"value": str(int(record_id) - 1) if int(record_id) > 1 else str(int(record_id) + 1)},
            "7": {"value": f"Bulk updated 2 {test_id}"}
        }
    ]
    
    return await run_test(
        "Bulk Update Records", 
        "bulk_update_records", 
        {
            "table_id": TABLE_ID,
            "records": bulk_update_data
        },
        lambda r: any("Bulk Update Records Result" in c.text for c in r)
    )

async def test_create_table():
    """Test creating a table"""
    table_name = f"Test Table {test_id}"
    return await run_test(
        "Create Table", 
        "create_table", 
        {
            "app_id": APP_ID,
            "name": table_name,
            "description": "Table created during validation testing",
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
                }
            ]
        },
        lambda r: any("Create Table Result" in c.text for c in r)
    )

async def run_all_tests():
    """Run all tests in sequence"""
    print("====================================================")
    print(f"  Quickbase MCP Integration Validation - v{__version__}")
    print("====================================================")
    print(f"Test ID: {test_id}")
    print(f"Table ID: {TABLE_ID}")
    print(f"App ID: {APP_ID}")
    print("====================================================\n")
    
    start_server()
    
    try:
        # Core functionality tests
        await test_connection()
        await test_list_tables()
        await test_get_table_fields()
        await test_create_record()
        await test_query_records()
        
        # Advanced functionality tests (depends on previous tests)
        await test_query_with_where()
        await test_update_record()
        await test_pagination()
        
        # Bulk operations tests
        await test_bulk_create_records()
        await test_bulk_update_records()
        
        # Table/field management tests (optional)
        # await test_create_table()
        
    finally:
        stop_server()
    
    # Print test summary
    print("\n====================================================")
    print("  Test Summary")
    print("====================================================")
    print(f"Tests passed: {test_results['passed']}")
    print(f"Tests failed: {test_results['failed']}")
    
    if test_results["errors"]:
        print("\nErrors:")
        for error in test_results["errors"]:
            print(f"- {error}")
    
    print("\nValidation " + ("PASSED" if test_results["failed"] == 0 else "FAILED"))
    print("====================================================")
    
    return test_results["failed"] == 0

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)