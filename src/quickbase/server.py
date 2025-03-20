# /// script
# dependencies = [
#   "mcp",
#   "requests",
#   "python-dotenv"
# ]
# ///
import asyncio
import json
from typing import Any, Optional, List, Dict, Union
import os
import requests
from dotenv import load_dotenv

import mcp.types as types
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio

class QuickbaseClient:
    """Handles Quickbase operations and caching using the v1 REST API."""
    
    def __init__(self):
        self.base_url = "https://api.quickbase.com/v1"
        self.session = requests.Session()
        self.schema_cache: dict[str, Any] = {}
        self.workflow_cache: dict[str, Any] = {}
        self.realm_hostname = None
        self.user_token = None

    def connect(self) -> bool:
        """Establishes connection to Quickbase using environment variables.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.realm_hostname = os.getenv('QUICKBASE_REALM_HOST')
            self.user_token = os.getenv('QUICKBASE_USER_TOKEN')
            
            if not self.realm_hostname or not self.user_token:
                raise ValueError("Missing required environment variables")
                
            # Set up default headers for all requests
            self.session.headers.update({
                'QB-Realm-Hostname': self.realm_hostname,
                'Authorization': f'QB-USER-TOKEN {self.user_token}',
                'Content-Type': 'application/json'
            })
            
            # Test connection by getting user info
            response = self.session.get(f"{self.base_url}/users/me")
            response.raise_for_status()
            return True
            
        except Exception as e:
            print(f"Quickbase connection failed: {str(e)}")
            return False

    # Table Operations
    def get_table_fields(self, table_id: str) -> list[dict]:
        """Retrieves field information for a specific Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            list[dict]: List of field definitions
        """
        try:
            response = self.session.get(f"{self.base_url}/fields?tableId={table_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get table fields: {str(e)}")
            return []

    def get_table_schema(self, table_id: str) -> dict:
        """Retrieves the complete schema for a table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            dict: Complete table schema
        """
        try:
            response = self.session.get(f"{self.base_url}/tables/{table_id}/schema")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get table schema: {str(e)}")
            return {}

    def get_table_relationships(self, table_id: str) -> list[dict]:
        """Retrieves relationships for a table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            list[dict]: List of table relationships
        """
        try:
            response = self.session.get(f"{self.base_url}/tables/{table_id}/relationships")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get table relationships: {str(e)}")
            return []

    # Record Operations
    def get_table_records(self, table_id: str, query: Optional[dict] = None) -> dict:
        """Retrieves records from a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            query (Optional[dict]): Query parameters for filtering records

        Returns:
            dict: Table records and metadata
        """
        try:
            if not query:
                query = {
                    "from": table_id,
                    "select": [3],  # Default to record ID field
                    "where": ""
                }
                
            response = self.session.post(f"{self.base_url}/records/query", json=query)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to query records: {str(e)}")
            return {"data": []}

    def create_record(self, table_id: str, data: dict) -> dict:
        """Creates a new record in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            data (dict): Record data to insert

        Returns:
            dict: Created record metadata
        """
        try:
            payload = {
                "to": table_id,
                "data": [data]
            }
            response = self.session.post(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to create record: {str(e)}")
            return {}

    def update_record(self, table_id: str, record_id: int, data: dict) -> dict:
        """Updates an existing record in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID to update
            data (dict): Updated field values

        Returns:
            dict: Updated record metadata
        """
        try:
            payload = {
                "to": table_id,
                "data": [{
                    "3": {"value": record_id},  # Record ID field
                    **data
                }]
            }
            response = self.session.post(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to update record: {str(e)}")
            return {}

    def delete_record(self, table_id: str, record_id: int) -> bool:
        """Deletes a record from a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID to delete

        Returns:
            bool: True if deletion successful
        """
        try:
            payload = {
                "from": table_id,
                "where": f"{3}.EX.'{record_id}'"  # Record ID field
            }
            response = self.session.delete(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Failed to delete record: {str(e)}")
            return False

    def bulk_create_records(self, table_id: str, records: List[dict]) -> dict:
        """Creates multiple records in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            records (List[dict]): List of records to create

        Returns:
            dict: Created records metadata
        """
        try:
            payload = {
                "to": table_id,
                "data": records
            }
            response = self.session.post(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to bulk create records: {str(e)}")
            return {}

    def bulk_update_records(self, table_id: str, records: List[dict]) -> dict:
        """Updates multiple records in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            records (List[dict]): List of records to update

        Returns:
            dict: Updated records metadata
        """
        try:
            payload = {
                "to": table_id,
                "data": records
            }
            response = self.session.post(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to bulk update records: {str(e)}")
            return {}

    def bulk_delete_records(self, table_id: str, record_ids: List[int]) -> bool:
        """Deletes multiple records from a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_ids (List[int]): List of record IDs to delete

        Returns:
            bool: True if deletion successful
        """
        try:
            record_ids_str = "','".join(map(str, record_ids))
            payload = {
                "from": table_id,
                "where": f"{3}.EX.'{record_ids_str}'"  # Record ID field
            }
            response = self.session.delete(f"{self.base_url}/records", json=payload)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Failed to bulk delete records: {str(e)}")
            return False

    # Report Operations
    def get_report(self, report_id: str) -> dict:
        """Retrieves a report definition.

        Args:
            report_id (str): The ID of the report

        Returns:
            dict: Report definition
        """
        try:
            response = self.session.get(f"{self.base_url}/reports/{report_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get report: {str(e)}")
            return {}

    def run_report(self, report_id: str, options: Optional[dict] = None) -> dict:
        """Runs a report with optional parameters.

        Args:
            report_id (str): The ID of the report
            options (Optional[dict]): Report run options

        Returns:
            dict: Report results
        """
        try:
            response = self.session.post(
                f"{self.base_url}/reports/{report_id}/run",
                json=options or {}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to run report: {str(e)}")
            return {}

    # File Operations
    def upload_file(self, table_id: str, record_id: int, field_id: int, file_path: str) -> dict:
        """Uploads a file to a record field.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID
            field_id (int): The field ID to upload to
            file_path (str): Path to the file to upload

        Returns:
            dict: Upload response
        """
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.base_url}/files",
                    files=files,
                    data={
                        'tableId': table_id,
                        'recordId': record_id,
                        'fieldId': field_id
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Failed to upload file: {str(e)}")
            return {}

    def download_file(self, file_id: str) -> bytes:
        """Downloads a file from QuickBase.

        Args:
            file_id (str): The ID of the file to download

        Returns:
            bytes: File contents
        """
        try:
            response = self.session.get(f"{self.base_url}/files/{file_id}")
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"Failed to download file: {str(e)}")
            return b""

    def delete_file(self, file_id: str) -> bool:
        """Deletes a file from QuickBase.

        Args:
            file_id (str): The ID of the file to delete

        Returns:
            bool: True if deletion successful
        """
        try:
            response = self.session.delete(f"{self.base_url}/files/{file_id}")
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Failed to delete file: {str(e)}")
            return False

    # User Operations
    def get_user(self, user_id: str) -> dict:
        """Retrieves user information.

        Args:
            user_id (str): The ID of the user

        Returns:
            dict: User information
        """
        try:
            response = self.session.get(f"{self.base_url}/users/{user_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get user: {str(e)}")
            return {}

    def get_current_user(self) -> dict:
        """Retrieves current user information.

        Returns:
            dict: Current user information
        """
        try:
            response = self.session.get(f"{self.base_url}/users/me")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get current user: {str(e)}")
            return {}

    def get_user_roles(self, user_id: str) -> list[dict]:
        """Retrieves roles for a user.

        Args:
            user_id (str): The ID of the user

        Returns:
            list[dict]: List of user roles
        """
        try:
            response = self.session.get(f"{self.base_url}/users/{user_id}/roles")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get user roles: {str(e)}")
            return []

    # Role Operations
    def get_role(self, role_id: str) -> dict:
        """Retrieves role information.

        Args:
            role_id (str): The ID of the role

        Returns:
            dict: Role information
        """
        try:
            response = self.session.get(f"{self.base_url}/roles/{role_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get role: {str(e)}")
            return {}

    def get_role_users(self, role_id: str) -> list[dict]:
        """Retrieves users in a role.

        Args:
            role_id (str): The ID of the role

        Returns:
            list[dict]: List of users in the role
        """
        try:
            response = self.session.get(f"{self.base_url}/roles/{role_id}/users")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get role users: {str(e)}")
            return []

    # App Operations
    def get_app(self, app_id: str) -> dict:
        """Retrieves application information.

        Args:
            app_id (str): The ID of the application

        Returns:
            dict: Application information
        """
        try:
            response = self.session.get(f"{self.base_url}/apps/{app_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get app: {str(e)}")
            return {}

    def get_app_tables(self, app_id: str) -> list[dict]:
        """Retrieves tables in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of tables in the application
        """
        try:
            response = self.session.get(f"{self.base_url}/apps/{app_id}/tables")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get app tables: {str(e)}")
            return []

    def get_app_roles(self, app_id: str) -> list[dict]:
        """Retrieves roles in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of roles in the application
        """
        try:
            response = self.session.get(f"{self.base_url}/apps/{app_id}/roles")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get app roles: {str(e)}")
            return []

    # Form Operations
    def get_form(self, table_id: str, form_id: str) -> dict:
        """Retrieves form information.

        Args:
            table_id (str): The ID of the table
            form_id (str): The ID of the form

        Returns:
            dict: Form information
        """
        try:
            response = self.session.get(f"{self.base_url}/forms/{table_id}/{form_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get form: {str(e)}")
            return {}

    def get_table_forms(self, table_id: str) -> list[dict]:
        """Retrieves forms for a table.

        Args:
            table_id (str): The ID of the table

        Returns:
            list[dict]: List of forms for the table
        """
        try:
            response = self.session.get(f"{self.base_url}/tables/{table_id}/forms")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get table forms: {str(e)}")
            return []

    # Dashboard Operations
    def get_dashboard(self, dashboard_id: str) -> dict:
        """Retrieves dashboard information.

        Args:
            dashboard_id (str): The ID of the dashboard

        Returns:
            dict: Dashboard information
        """
        try:
            response = self.session.get(f"{self.base_url}/dashboards/{dashboard_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get dashboard: {str(e)}")
            return {}

    def get_app_dashboards(self, app_id: str) -> list[dict]:
        """Retrieves dashboards in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of dashboards in the application
        """
        try:
            response = self.session.get(f"{self.base_url}/apps/{app_id}/dashboards")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to get app dashboards: {str(e)}")
            return []

# Create a server instance
server = Server("quickbase-mcp")

# Load environment variables
load_dotenv()

# Configure with Quickbase credentials from environment variables
qb_client = QuickbaseClient()
if not qb_client.connect():
    print("Failed to initialize Quickbase connection")
    # Optionally exit here if Quickbase is required
    # sys.exit(1)

@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    """List available Quickbase resources."""
    return [
        types.Resource(
            name="tables",
            description="Tables in the Quickbase application",
            properties={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table"
                    },
                    "name": {
                        "type": "string",
                        "description": "The name of the table"
                    }
                }
            }
        ),
        types.Resource(
            name="reports",
            description="Reports in the Quickbase application",
            properties={
                "type": "object",
                "properties": {
                    "report_id": {
                        "type": "string",
                        "description": "The ID of the report"
                    },
                    "name": {
                        "type": "string",
                        "description": "The name of the report"
                    },
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table this report belongs to"
                    }
                }
            }
        ),
        types.Resource(
            name="forms",
            description="Forms in the Quickbase application",
            properties={
                "type": "object",
                "properties": {
                    "form_id": {
                        "type": "string",
                        "description": "The ID of the form"
                    },
                    "name": {
                        "type": "string",
                        "description": "The name of the form"
                    },
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table this form belongs to"
                    }
                }
            }
        )
    ]

@server.list_prompts()
async def handle_list_prompts() -> list[types.Prompt]:
    """List available prompts for common Quickbase operations."""
    return [
        types.Prompt(
            name="query_table",
            description="Query records from a Quickbase table",
            prompt="Query {table_name} table for {fields} where {condition}",
            parameters={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table to query"
                    },
                    "fields": {
                        "type": "string",
                        "description": "Fields to retrieve (comma-separated)"
                    },
                    "condition": {
                        "type": "string",
                        "description": "Query condition (optional)"
                    }
                },
                "required": ["table_name", "fields"]
            }
        ),
        types.Prompt(
            name="create_new_record",
            description="Create a new record in a Quickbase table",
            prompt="Create a new record in {table_name} with {field_values}",
            parameters={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table"
                    },
                    "field_values": {
                        "type": "string",
                        "description": "Field values in format: field1=value1, field2=value2"
                    }
                },
                "required": ["table_name", "field_values"]
            }
        )
    ]

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available tools.
    Each tool specifies its arguments using JSON Schema validation.
    """
    return [
        types.Tool(
            name="list_tables",
            description="Lists all tables in the Quickbase application",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        types.Tool(
            name="test_connection",
            description="Tests the connection to Quickbase",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        types.Tool(
            name="query_records",
            description="Executes a query against a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "select": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Fields to select",
                    },
                    "where": {
                        "type": "string",
                        "description": "Query criteria",
                    },
                    "options": {
                        "type": "object",
                        "properties": {
                            "skip": {"type": "integer"},
                            "top": {"type": "integer"},
                            "groupBy": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        }
                    }
                },
                "required": ["table_id"],
            },
        ),
        types.Tool(
            name="get_table_fields",
            description="Retrieves field information for a specific Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                },
                "required": ["table_id"],
            },
        ),
        types.Tool(
            name="create_record",
            description="Creates a new record in a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "data": {
                        "type": "object",
                        "description": "The data for the new record",
                        "properties": {},
                        "additionalProperties": True,
                    },
                },
                "required": ["table_id", "data"],
            },
        ),
        types.Tool(
            name="update_record",
            description="Updates an existing record in a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record to update",
                    },
                    "data": {
                        "type": "object",
                        "description": "The updated data for the record",
                        "properties": {},
                        "additionalProperties": True,
                    },
                },
                "required": ["table_id", "record_id", "data"],
            },
        ),
        types.Tool(
            name="delete_record",
            description="Deletes a record from a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record to delete",
                    },
                },
                "required": ["table_id", "record_id"],
            },
        ),
        types.Tool(
            name="run_report",
            description="Executes a Quickbase report",
            inputSchema={
                "type": "object",
                "properties": {
                    "report_id": {
                        "type": "string",
                        "description": "The ID of the report to run",
                    },
                    "options": {
                        "type": "object",
                        "properties": {
                            "skip": {"type": "integer"},
                            "top": {"type": "integer"},
                            "format": {"type": "string"},
                            "filters": {"type": "object"},
                            "groupBy": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "sortBy": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        }
                    }
                },
                "required": ["report_id"],
            },
        ),
        types.Tool(
            name="manage_attachments",
            description="Manages file attachments for Quickbase records",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The action to perform (upload/download/delete)",
                        "enum": ["upload", "download", "delete"]
                    },
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record",
                    },
                    "attachment_id": {
                        "type": "string",
                        "description": "The ID of the attachment (required for download/delete)",
                    },
                    "file_path": {
                        "type": "string",
                        "description": "The path to the file (required for upload)",
                    },
                },
                "required": ["action", "table_id", "record_id"],
            },
        ),
        types.Tool(
            name="manage_users",
            description="Manages Quickbase users and their roles",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The action to perform (add/update/remove)",
                        "enum": ["add", "update", "remove"]
                    },
                    "email": {
                        "type": "string",
                        "description": "The email of the user",
                    },
                    "role_id": {
                        "type": "string",
                        "description": "The ID of the role to assign",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for the action",
                        "properties": {},
                        "additionalProperties": True,
                    },
                },
                "required": ["action", "email", "role_id"],
            },
        ),
        types.Tool(
            name="manage_forms",
            description="Manages Quickbase forms and their configurations",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The action to perform (get/update)",
                        "enum": ["get", "update"]
                    },
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "form_id": {
                        "type": "string",
                        "description": "The ID of the form",
                    },
                    "form_config": {
                        "type": "object",
                        "description": "The form configuration (required for update)",
                        "properties": {},
                        "additionalProperties": True,
                    },
                },
                "required": ["action", "table_id", "form_id"],
            },
        ),
        types.Tool(
            name="manage_dashboards",
            description="Manages Quickbase dashboards and their configurations",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The action to perform (get/update)",
                        "enum": ["get", "update"]
                    },
                    "dashboard_id": {
                        "type": "string",
                        "description": "The ID of the dashboard",
                    },
                    "dashboard_config": {
                        "type": "object",
                        "description": "The dashboard configuration (required for update)",
                        "properties": {},
                        "additionalProperties": True,
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for the action",
                        "properties": {},
                        "additionalProperties": True,
                    },
                },
                "required": ["action", "dashboard_id"],
            },
        ),
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, str]) -> list[types.TextContent]:
    if name == "list_tables":
        try:
            app_id = os.getenv('QUICKBASE_APP_ID')
            tables = qb_client.session.get(f"{qb_client.base_url}/tables?appId={app_id}").json()
            formatted_tables = []
            for table in tables:
                formatted_tables.append({
                    "id": table.get("id"),
                    "name": table.get("name"),
                    "description": table.get("description", "")
                })
            return [
                types.TextContent(
                    type="text",
                    text=f"Available Tables in App {app_id}:\n{json.dumps(formatted_tables, indent=2)}"
                )
            ]
        except Exception as e:
            return [
                types.TextContent(
                    type="text",
                    text=f"Error listing tables: {str(e)}"
                )
            ]
    elif name == "test_connection":
        if qb_client.session is None:
            success = qb_client.connect()
            status = "Connected successfully" if success else "Connection failed"
        else:
            status = "Already connected"
        return [
            types.TextContent(
                type="text",
                text=f"Quickbase Connection Status: {status}\nRealm: {qb_client.realm_hostname}\nApp ID: {os.getenv('QUICKBASE_APP_ID')}"
            )
        ]
    elif name == "query_records":
        table_id = arguments.get("table_id")
        select = arguments.get("select", [])
        where = arguments.get("where", "")
        options = arguments.get("options", {})

        if not table_id:
            raise ValueError("Missing 'table_id' argument")

        results = qb_client.get_table_records(table_id, query={
            "from": table_id,
            "select": select,
            "where": where,
            **options
        })
        return [
            types.TextContent(
                type="text",
                text=f"Query Results (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "get_table_fields":
        table_id = arguments.get("table_id")
        if not table_id:
            raise ValueError("Missing 'table_id' argument")

        results = qb_client.get_table_fields(table_id)
        return [
            types.TextContent(
                type="text",
                text=f"Table Fields (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "create_record":
        table_id = arguments.get("table_id")
        data = arguments.get("data")
        if not table_id or not data:
            raise ValueError("Missing 'table_id' or 'data' argument")

        results = qb_client.create_record(table_id, data)
        return [
            types.TextContent(
                type="text",
                text=f"Create Record Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "update_record":
        table_id = arguments.get("table_id")
        record_id = arguments.get("record_id")
        data = arguments.get("data")
        if not table_id or not record_id or not data:
            raise ValueError("Missing 'table_id', 'record_id', or 'data' argument")

        results = qb_client.update_record(table_id, record_id, data)
        return [
            types.TextContent(
                type="text",
                text=f"Update Record Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "delete_record":
        table_id = arguments.get("table_id")
        record_id = arguments.get("record_id")
        if not table_id or not record_id:
            raise ValueError("Missing 'table_id' or 'record_id' argument")

        results = qb_client.delete_record(table_id, record_id)
        return [
            types.TextContent(
                type="text",
                text=f"Delete Record Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "run_report":
        report_id = arguments.get("report_id")
        options = arguments.get("options", {})
        if not report_id:
            raise ValueError("Missing 'report_id' argument")

        results = qb_client.run_report(report_id, options)
        return [
            types.TextContent(
                type="text",
                text=f"Report Results (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "manage_attachments":
        action = arguments.get("action")
        table_id = arguments.get("table_id")
        record_id = arguments.get("record_id")
        attachment_id = arguments.get("attachment_id")
        file_path = arguments.get("file_path")

        if not action or not table_id or not record_id:
            raise ValueError("Missing required arguments")

        if action == "upload" and not file_path:
            raise ValueError("Missing 'file_path' for upload action")
        elif action in ["download", "delete"] and not attachment_id:
            raise ValueError("Missing 'attachment_id' for download/delete action")

        results = qb_client.upload_file(table_id, record_id, attachment_id, file_path)
        return [
            types.TextContent(
                type="text",
                text=f"Attachment Operation Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "manage_users":
        action = arguments.get("action")
        email = arguments.get("email")
        role_id = arguments.get("role_id")
        options = arguments.get("options", {})

        if not action or not email or not role_id:
            raise ValueError("Missing required arguments")

        results = qb_client.session.post(f"{qb_client.base_url}/users", json={"action": action, "email": email, "roleId": role_id, **options}).json()
        return [
            types.TextContent(
                type="text",
                text=f"User Management Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "manage_forms":
        action = arguments.get("action")
        table_id = arguments.get("table_id")
        form_id = arguments.get("form_id")
        form_config = arguments.get("form_config")

        if not action or not table_id or not form_id:
            raise ValueError("Missing required arguments")
        if action == "update" and not form_config:
            raise ValueError("Missing 'form_config' for update action")

        results = qb_client.session.post(f"{qb_client.base_url}/forms/{table_id}/{form_id}", json=form_config).json()
        return [
            types.TextContent(
                type="text",
                text=f"Form Management Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    elif name == "manage_dashboards":
        action = arguments.get("action")
        dashboard_id = arguments.get("dashboard_id")
        dashboard_config = arguments.get("dashboard_config")
        options = arguments.get("options", {})

        if not action or not dashboard_id:
            raise ValueError("Missing required arguments")
        if action == "update" and not dashboard_config:
            raise ValueError("Missing 'dashboard_config' for update action")

        results = qb_client.session.post(f"{qb_client.base_url}/dashboards/{dashboard_id}", json={"action": action, "dashboard": dashboard_config, **options}).json()
        return [
            types.TextContent(
                type="text",
                text=f"Dashboard Management Result (JSON):\n{json.dumps(results, indent=2)}",
            )
        ]
    raise ValueError(f"Unknown tool: {name}")

async def run():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(
            read,
            write,
            InitializationOptions(
                server_name="quickbase-mcp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(run()) 