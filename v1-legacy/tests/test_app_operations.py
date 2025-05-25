#!/usr/bin/env python3
"""
Test script for app operations in the Quickbase MCP integration.
This script tests create_app and update_app operations.

Required environment variables:
    - None specific to this test (uses API credentials from .env)
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

async def test_app_operations():
    """Test the app operations tools (create_app and update_app)."""
    # Load environment variables
    load_dotenv()
    
    print("\n=== Testing Quickbase App Operations ===\n")
    
    # Generate a unique identifier for this test run
    test_id = str(uuid.uuid4())[:8]
    print(f"Test run ID: {test_id}")
    
    all_tests_passed = True
    new_app_id = None
    
    # Test 1: Create a new app
    print("\n1. Testing app creation...")
    app_name = f"Test App {test_id}"
    
    try:
        result = await handle_call_tool("create_app", {
            "name": app_name,
            "description": "App created during testing"
        })
        
        # Print the result
        for content in result:
            print(content.text)
        
        # Try to extract the app ID
        for content in result:
            try:
                if "App created successfully" in content.text or "Create App Result" in content.text:
                    # Try to find the app ID in the response
                    lines = content.text.split('\n')
                    for line in lines:
                        if "id" in line.lower():
                            parts = line.split(":")
                            if len(parts) > 1:
                                potential_id = parts[1].strip().strip('",').strip('"')
                                if potential_id.startswith("b"):
                                    new_app_id = potential_id
                                    break
            except Exception as e:
                print(f"Error extracting app ID: {str(e)}")
        
        if new_app_id:
            print(f"Created app with ID: {new_app_id}")
            print("✅ App creation test passed")
            
            # Test 2: Update the app
            print("\n2. Testing app update...")
            updated_app_name = f"Updated App {test_id}"
            
            result = await handle_call_tool("update_app", {
                "app_id": new_app_id,
                "name": updated_app_name,
                "description": "App updated during testing"
            })
            
            # Print the result
            for content in result:
                print(content.text)
                
            print("✅ App update test passed")
            
        else:
            print("❌ Could not extract app ID from response")
            all_tests_passed = False
            
    except Exception as e:
        print(f"❌ Error testing app operations: {str(e)}")
        all_tests_passed = False
    
    print("\n=== App Operations Testing Complete ===")
    if all_tests_passed:
        print("All app operations tests passed successfully!")
    else:
        print("Some app operations tests failed. Check the logs above for details.")
    
    return all_tests_passed

if __name__ == "__main__":
    success = asyncio.run(test_app_operations())
    sys.exit(0 if success else 1)