#!/usr/bin/env python3
"""
Test script for app operations in the Quickbase MCP integration.
This script tests create_app and update_app operations.
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
    
    print("Testing app operations\n")
    
    # Generate a unique identifier for this test run
    test_id = str(uuid.uuid4())[:8]
    
    # Test 1: Create a new app
    print("Test 1: Creating a new app")
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
        new_app_id = None
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
            print(f"Successfully created app with ID: {new_app_id}\n")
            
            # Test 2: Update the app
            print("Test 2: Updating the app")
            updated_app_name = f"Updated App {test_id}"
            
            result = await handle_call_tool("update_app", {
                "app_id": new_app_id,
                "name": updated_app_name,
                "description": "App updated during testing"
            })
            
            # Print the result
            for content in result:
                print(content.text)
                
            print("App update test completed.\n")
        else:
            print("Error: Could not extract app ID from response.")
            
        print("All app operations tests completed!")
        return True
        
    except Exception as e:
        print(f"Error testing app operations: {str(e)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_app_operations())
    sys.exit(0 if result else 1)