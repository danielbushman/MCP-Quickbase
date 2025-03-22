import requests
import json
import os

# Define URL
url = "https://api.quickbase.com/v1/fields/14?tableId=buy479b7i"

# Headers
headers = {
    "QB-Realm-Hostname": "team.quickbase.com",
    # Other headers would be needed for authentication
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {str(e)}")

