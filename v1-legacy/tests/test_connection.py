#!/usr/bin/env python3
"""
Test script for verifying connection to the Quickbase API.
This script tests basic connectivity using environment variables.
"""

import asyncio
import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

async def test_connection():
    """Test connection to Quickbase API using environment variables."""
    # Load environment variables
    load_dotenv()

    print("\n=== Testing Connection to Quickbase API ===\n")
    print("Environment variables:")
    print(f"QUICKBASE_REALM_HOST: {os.getenv('QUICKBASE_REALM_HOST')}")
    print(f"QUICKBASE_APP_ID: {os.getenv('QUICKBASE_APP_ID')}")
    print(f"QUICKBASE_USER_TOKEN: {'*' * 8 if os.getenv('QUICKBASE_USER_TOKEN') else 'Not set'}")

    try:
        # Get environment variables
        realm_hostname = os.getenv('QUICKBASE_REALM_HOST')
        app_id = os.getenv('QUICKBASE_APP_ID')
        user_token = os.getenv('QUICKBASE_USER_TOKEN')

        # Validate environment variables
        if not realm_hostname or not app_id or not user_token:
            missing_vars = []
            if not realm_hostname:
                missing_vars.append("QUICKBASE_REALM_HOST")
            if not app_id:
                missing_vars.append("QUICKBASE_APP_ID")
            if not user_token:
                missing_vars.append("QUICKBASE_USER_TOKEN")

            print(f"\nError: Missing required environment variables: {', '.join(missing_vars)}")
            return False

        # Set up headers for API request
        headers = {
            'QB-Realm-Hostname': realm_hostname,
            'Authorization': f'QB-USER-TOKEN {user_token}',
            'Content-Type': 'application/json'
        }

        # Test connection by getting app info
        url = f"https://api.quickbase.com/v1/apps/{app_id}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        print("\nConnection successful!")
        print(f"App info: {response}")
        print("\nConnection test completed.")

        return True

    except requests.exceptions.HTTPError as e:
        print(f"\nConnection failed: HTTP Error {e.response.status_code}")
        print(f"Response: {e.response.text}")
        return False
    except Exception as e:
        print(f"\nConnection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)