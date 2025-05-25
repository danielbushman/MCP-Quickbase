#!/usr/bin/env python3
"""
Test script for the Quickbase MCP tools, specifically focusing on cache functionality.

This script tests the configure_cache tool and verifies that caching is working correctly
by measuring the time it takes to execute operations with and without caching.
"""

import os
import json
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_credentials():
    """Get Quickbase credentials from environment variables."""
    return {
        "realm_hostname": os.getenv("QB_REALM_HOSTNAME"),
        "user_token": os.getenv("QB_USER_TOKEN")
    }

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

def test_configure_cache():
    """Test the configure_cache tool."""
    print("\n--- Testing Cache Configuration ---")
    
    # First enable caching
    result = call_tool("configure_cache", enabled=True, clear=True)
    print("Configure cache (enable):", result["content"][0]["text"])
    
    # Test caching by measuring performance
    print("\nPerformance test with caching enabled:")
    
    # Get an app ID to use for testing
    apps = call_tool("list_tables")
    app_tables = json.loads(apps["content"][0]["text"].split("Result (JSON):\n")[1])
    table_id = app_tables[0]["id"] if app_tables else None
    
    if not table_id:
        print("No tables found for testing, skipping performance test")
        return
    
    # Run the same query multiple times and measure time
    times_cached = []
    for i in range(3):
        start = time.time()
        call_tool("get_table_fields", table_id=table_id)
        end = time.time()
        times_cached.append(end - start)
        print(f"Query {i+1} with caching: {times_cached[-1]:.4f} seconds")
    
    # Disable caching
    result = call_tool("configure_cache", enabled=False)
    print("\nConfigure cache (disable):", result["content"][0]["text"])
    
    # Run the same query without caching
    print("\nPerformance test with caching disabled:")
    times_uncached = []
    for i in range(3):
        start = time.time()
        call_tool("get_table_fields", table_id=table_id)
        end = time.time()
        times_uncached.append(end - start)
        print(f"Query {i+1} without caching: {times_uncached[-1]:.4f} seconds")
    
    # Calculate and print performance improvement
    avg_cached = sum(times_cached[1:]) / len(times_cached[1:])  # Skip first (cold) call
    avg_uncached = sum(times_uncached) / len(times_uncached)
    improvement = (avg_uncached - avg_cached) / avg_uncached * 100
    
    print(f"\nAverage time with caching: {avg_cached:.4f} seconds")
    print(f"Average time without caching: {avg_uncached:.4f} seconds")
    print(f"Performance improvement: {improvement:.2f}%")
    
    # Re-enable caching for future tests
    call_tool("configure_cache", enabled=True)

def main():
    """Main function to run all tests."""
    # Test cache configuration
    try:
        test_configure_cache()
        print("\nAll cache tests completed successfully!")
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    main()