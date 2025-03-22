from dotenv import load_dotenv
import os
from quickbase_client import QuickbaseApiClient

def test_connection():
    load_dotenv()
    
    print("Environment variables:")
    print(f"QUICKBASE_REALM_HOST: {os.getenv('QUICKBASE_REALM_HOST')}")
    print(f"QUICKBASE_APP_ID: {os.getenv('QUICKBASE_APP_ID')}")
    print(f"QUICKBASE_USER_TOKEN: {'*' * 8 if os.getenv('QUICKBASE_USER_TOKEN') else 'Not set'}")
    
    try:
        client = QuickbaseApiClient(
            user_token=os.getenv('QUICKBASE_USER_TOKEN'),
            realm_hostname=os.getenv('QUICKBASE_REALM_HOST')
        )
        
        # Try to make a simple API call
        app = client.get_app(os.getenv('QUICKBASE_APP_ID'))
        print("\nConnection successful!")
        print(f"App info: {app}")
        
    except Exception as e:
        print("\nConnection failed!")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_connection() 