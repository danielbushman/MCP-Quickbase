#!/usr/bin/env python3
"""
Test script for verifying connection to the Quickbase API.
This script tests basic connectivity using environment variables.
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_connection():
    """Test connection to Quickbase API using environment variables."""
    load_dotenv()

    realm_hostname = os.getenv("QUICKBASE_REALM_HOST")
    app_id = os.getenv("QUICKBASE_APP_ID")
    user_token = os.getenv("QUICKBASE_USER_TOKEN")

    # Assert required environment variables are present
    assert realm_hostname, "Missing QUICKBASE_REALM_HOST"
    assert app_id, "Missing QUICKBASE_APP_ID"
    assert user_token, "Missing QUICKBASE_USER_TOKEN"

    headers = {
        "QB-Realm-Hostname": realm_hostname,
        "Authorization": f"QB-USER-TOKEN {user_token}",
        "Content-Type": "application/json",
    }

    url = f"https://api.quickbase.com/v1/apps/{app_id}"
    response = requests.get(url, headers=headers)

    # Assert that the response was successful
    assert (
        response.status_code == 200
    ), f"Unexpected status code: {response.status_code}\n{response.text}"

if __name__ == "__main__":
    test_connection()