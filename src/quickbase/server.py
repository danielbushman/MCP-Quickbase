# /// script
# dependencies = [
#   "mcp",
#   "requests",
#   "python-dotenv"
# ]
# ///
import asyncio
import json
import time
import functools
import logging
from typing import Any, Optional, List, Dict, Union, Callable, TypeVar
import os
import requests
from dotenv import load_dotenv

import mcp.types as types
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions

# Import our utility modules
from .retry import retry
from .cache import app_cache, table_cache, field_cache, cached
from .logging_utils import log_request, log_response
import mcp.server.stdio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('quickbase_mcp')

# Type variables for generic types
T = TypeVar('T')

class QuickbaseError(Exception):
    """Base exception for QuickBase API errors."""
    def __init__(self, message: str, status_code: int = None, response: dict = None):
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(message)

class QuickbaseAuthenticationError(QuickbaseError):
    """Raised when authentication fails."""
    pass

class QuickbaseValidationError(QuickbaseError):
    """Raised when request validation fails."""
    pass

class QuickbaseNotFoundError(QuickbaseError):
    """Raised when a resource is not found."""
    pass

class QuickbaseRateLimitError(QuickbaseError):
    """Raised when rate limit is exceeded."""
    pass

class QuickbaseServerError(QuickbaseError):
    """Raised when QuickBase server encounters an error."""
    pass

def retry(max_tries: int = 3, delay: float = 1.0, backoff: float = 2.0, 
          exceptions: tuple = (QuickbaseServerError, QuickbaseRateLimitError, requests.ConnectionError)):
    """
    Retry decorator with exponential backoff for API requests.
    
    Args:
        max_tries (int): Maximum number of attempts (default: 3)
        delay (float): Initial delay between retries in seconds (default: 1.0)
        backoff (float): Backoff multiplier (default: 2.0)
        exceptions (tuple): Exceptions to catch and retry (default: QuickbaseServerError, 
                            QuickbaseRateLimitError, requests.ConnectionError)
    
    Returns:
        Callable: Decorated function with retry logic
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            mtries, mdelay = max_tries, delay
            last_exception = None
            
            while mtries > 0:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    mtries -= 1
                    if mtries == 0:
                        break
                        
                    sleep_time = mdelay
                    
                    # If rate limited and response contains retry-after header, use that value
                    if isinstance(e, QuickbaseRateLimitError) and hasattr(e, 'response'):
                        response_headers = getattr(e, 'response', {}).get('headers', {})
                        retry_after = response_headers.get('retry-after', None)
                        if retry_after:
                            try:
                                sleep_time = float(retry_after)
                            except (ValueError, TypeError):
                                pass
                    
                    logger.warning(f"Retrying '{func.__name__}' in {sleep_time:.2f}s due to {e.__class__.__name__}: {str(e)}")
                    time.sleep(sleep_time)
                    mdelay *= backoff
                    
            if last_exception:
                logger.error(f"Function '{func.__name__}' failed after {max_tries} tries: {str(last_exception)}")
                raise last_exception
                
        return wrapper
    return decorator

class QuickbaseClient:
    """Handles Quickbase operations and caching using the v1 REST API."""
    
    def __init__(self):
        self.base_url = "https://api.quickbase.com/v1"
        self.session = requests.Session()
        self.realm_hostname = None
        self.user_token = None
        
        # Set up logging
        self.logger = logging.getLogger(__name__)
        
        # Use Cache instances instead of simple dictionaries
        self.use_cache = True
        
    def configure_cache(self, enabled: bool = True, clear: bool = False):
        """Configure cache behavior.
        
        Args:
            enabled (bool): Whether to enable caching
            clear (bool): Whether to clear all caches
        """
        self.use_cache = enabled
        
        if clear:
            self.logger.info("Clearing all caches")
            app_cache.clear()
            table_cache.clear()
            field_cache.clear()

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Makes an API request with proper logging.
        
        Args:
            method (str): HTTP method
            endpoint (str): API endpoint
            **kwargs: Additional request parameters
            
        Returns:
            requests.Response: The response object
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Log the request
        log_request(method, url, 
                   headers=kwargs.get('headers'), 
                   data=kwargs.get('json') or kwargs.get('data'))
        
        # Make the request
        return self.session.request(method, url, **kwargs)

    def _handle_response(self, response: requests.Response) -> Any:
        """Handles API response and raises appropriate exceptions.
        
        Args:
            response (requests.Response): The API response
            
        Returns:
            Any: The response data
            
        Raises:
            QuickbaseAuthenticationError: If authentication fails
            QuickbaseValidationError: If request validation fails
            QuickbaseNotFoundError: If resource not found
            QuickbaseRateLimitError: If rate limit exceeded
            QuickbaseServerError: If server error occurs
        """
        # Log the response
        log_response(response)
        
        try:
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            status_code = response.status_code
            try:
                error_data = response.json() if response.content else {}
            except:
                error_data = {"error": str(e)}
            
            if status_code == 401:
                raise QuickbaseAuthenticationError(
                    "Authentication failed. Please check your credentials.",
                    status_code,
                    error_data
                )
            elif status_code == 403:
                raise QuickbaseAuthenticationError(
                    "Access denied. Please check your permissions.",
                    status_code,
                    error_data
                )
            elif status_code == 404:
                raise QuickbaseNotFoundError(
                    f"Resource not found: {response.url}",
                    status_code,
                    error_data
                )
            elif status_code == 422:
                raise QuickbaseValidationError(
                    "Invalid request data.",
                    status_code,
                    error_data
                )
            elif status_code == 429:
                raise QuickbaseRateLimitError(
                    "Rate limit exceeded. Please try again later.",
                    status_code,
                    error_data
                )
            elif status_code >= 500:
                raise QuickbaseServerError(
                    "QuickBase server error. Please try again later.",
                    status_code,
                    error_data
                )
            else:
                raise QuickbaseError(
                    f"API request failed with status {status_code}",
                    status_code,
                    error_data
                )
        except requests.exceptions.RequestException as e:
            raise QuickbaseError(f"Request failed: {str(e)}")

    def connect(self) -> bool:
        """Establishes connection to Quickbase using environment variables.
        
        Returns:
            bool: True if connection successful, False otherwise
            
        Raises:
            QuickbaseAuthenticationError: If authentication fails
        """
        try:
            self.realm_hostname = os.getenv('QUICKBASE_REALM_HOST')
            self.user_token = os.getenv('QUICKBASE_USER_TOKEN')
            
            if not self.realm_hostname or not self.user_token:
                raise QuickbaseAuthenticationError("Missing required environment variables")
                
            # Set up default headers for all requests
            self.session.headers.update({
                'QB-Realm-Hostname': self.realm_hostname,
                'Authorization': f'QB-USER-TOKEN {self.user_token}',
                'Content-Type': 'application/json'
            })
            
            # Test connection by getting app info instead of user info
            app_id = os.getenv('QUICKBASE_APP_ID')
            if not app_id:
                raise QuickbaseAuthenticationError("Missing QUICKBASE_APP_ID environment variable")
                
            response = self.session.get(f"{self.base_url}/apps/{app_id}")
            self._handle_response(response)
            return True
            
        except QuickbaseAuthenticationError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Connection failed: {str(e)}")

    # Table Operations
    def get_table_fields(self, table_id: str) -> list[dict]:
        """Retrieves field information for a specific Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            list[dict]: List of field definitions
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"fields_{table_id}"
            cached_fields = field_cache.get(cache_key)
            if cached_fields is not None:
                self.logger.debug(f"Cache hit for table fields: {table_id}")
                return cached_fields
                
        try:
            response = self._request("GET", f"fields?tableId={table_id}")
            fields = self._handle_response(response)
            
            # Cache the fields
            if self.use_cache:
                field_cache.set(f"fields_{table_id}", fields)
                
            return fields
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get table fields: {str(e)}")

    def get_table_schema(self, table_id: str) -> dict:
        """Retrieves the complete schema for a table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            dict: Complete table schema
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"schema_{table_id}"
            cached_schema = table_cache.get(cache_key)
            if cached_schema is not None:
                self.logger.debug(f"Cache hit for table schema: {table_id}")
                return cached_schema
                
        try:
            response = self._request("GET", f"tables/{table_id}/schema")
            schema = self._handle_response(response)
            
            # Cache the schema
            if self.use_cache:
                table_cache.set(f"schema_{table_id}", schema)
                
            return schema
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get table schema: {str(e)}")

    def get_table_relationships(self, table_id: str) -> list[dict]:
        """Retrieves relationships for a table.

        Args:
            table_id (str): The ID of the Quickbase table.

        Returns:
            list[dict]: List of table relationships
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"relationships_{table_id}"
            cached_relationships = table_cache.get(cache_key)
            if cached_relationships is not None:
                self.logger.debug(f"Cache hit for table relationships: {table_id}")
                return cached_relationships
                
        try:
            response = self._request("GET", f"tables/{table_id}/relationships")
            relationships = self._handle_response(response)
            
            # Cache the relationships
            if self.use_cache:
                table_cache.set(f"relationships_{table_id}", relationships)
                
            return relationships
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get table relationships: {str(e)}")

    # Record Operations
    @retry(exceptions=[requests.exceptions.RequestException], max_tries=3, delay=1.0, backoff=2.0)
    def get_table_records(self, table_id: str, query: Optional[dict] = None, 
                         paginate: bool = False, max_records: int = 1000) -> dict:
        """Retrieves records from a Quickbase table with optional pagination.

        Args:
            table_id (str): The ID of the Quickbase table
            query (Optional[dict]): Query parameters for filtering records
            paginate (bool): Whether to automatically handle pagination
            max_records (int): Maximum number of records to return when paginating

        Returns:
            dict: Table records and metadata
            
        Raises:
            QuickbaseError: If the API request fails
            
        Note:
            This method uses retry logic to handle transient errors
        """
        try:
            if not query:
                query = {
                    "from": table_id,
                    "select": [3],  # Default to record ID field
                    "where": ""
                }
            
            # If not paginating, just make a single request
            if not paginate:
                response = self.session.post(f"{self.base_url}/records/query", json=query)
                response.raise_for_status()
                return response.json()
                
            # Handle pagination
            all_data = []
            metadata = {}
            fields = []
            total_fetched = 0
            
            # Initialize options if not present
            if "options" not in query:
                query["options"] = {}
                
            # Start with skip = 0 if not specified
            if "skip" not in query["options"]:
                query["options"]["skip"] = 0
                
            # Set default page size
            page_size = query["options"].get("top", 100)
            query["options"]["top"] = page_size
            
            while total_fetched < max_records:
                # Make the API call
                response = self.session.post(f"{self.base_url}/records/query", json=query)
                response.raise_for_status()
                result = response.json()
                
                # Store metadata from the first response
                if not metadata and "metadata" in result:
                    metadata = result["metadata"]
                    
                # Store fields from the first response
                if not fields and "fields" in result:
                    fields = result["fields"]
                    
                # Get the data
                if "data" in result:
                    page_data = result["data"]
                    all_data.extend(page_data)
                    total_fetched += len(page_data)
                    
                    # If we got fewer records than requested, we've reached the end
                    if len(page_data) < page_size:
                        break
                        
                    # Update skip for the next page
                    query["options"]["skip"] += page_size
                else:
                    # No data in response
                    break
                    
            # Combine the results
            return {
                "data": all_data,
                "metadata": metadata,
                "fields": fields,
                "pagination": {
                    "total_records_fetched": total_fetched,
                    "max_records": max_records,
                    "page_size": page_size
                }
            }
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                status_code = e.response.status_code
                try:
                    error_data = e.response.json()
                except:
                    error_data = {"message": str(e)}
                raise QuickbaseError(
                    f"Failed to query records: {str(e)}",
                    status_code,
                    error_data
                )
            raise QuickbaseError(f"Failed to query records: {str(e)}")
        except Exception as e:
            raise QuickbaseError(f"Failed to query records: {str(e)}")

    def create_record(self, table_id: str, data: dict) -> dict:
        """Creates a new record in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            data (dict): Record data to insert

        Returns:
            dict: Created record metadata
        """
        try:
            # Format the data according to QuickBase's API requirements
            formatted_data = {}
            for field_id, value in data.items():
                formatted_data[field_id] = {"value": value}

            payload = {
                "to": table_id,
                "data": [formatted_data]
            }
            
            response = self.session.post(f"{self.base_url}/records", json=payload)
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to create record: {str(e)}")

    def update_record(self, table_id: str, record_id: int, data: dict) -> dict:
        """Updates an existing record in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID to update
            data (dict): Updated field values

        Returns:
            dict: Updated record metadata
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Convert to int if it's a string
            if isinstance(record_id, str):
                record_id = int(record_id)
            
            # Format the data for QuickBase API
            formatted_data = {"3": {"value": record_id}}  # Record ID field
            
            # Add the other fields to update
            for field_id, value in data.items():
                # Convert to int if it's a string
                if isinstance(field_id, str) and field_id.isdigit():
                    field_id = int(field_id)
                
                # Skip if the field ID is already 3 (record ID field)
                if field_id == 3:
                    continue
                    
                formatted_data[str(field_id)] = {"value": value}
            
            payload = {
                "to": table_id,
                "data": [formatted_data]
            }
            
            response = self.session.post(f"{self.base_url}/records", json=payload)
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to update record: {str(e)}")

    def delete_record(self, table_id: str, record_id: int) -> bool:
        """Deletes a record from a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID to delete

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure record_id is an integer
            if isinstance(record_id, str):
                record_id = int(record_id)
                
            # Delete using direct where clause
            delete_payload = {
                "from": table_id,
                "where": f"({3}.EX.{record_id})"
            }
            delete_response = self.session.delete(f"{self.base_url}/records", json=delete_payload)
            self._handle_response(delete_response)
            return True
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to delete record: {str(e)}")

    @retry(exceptions=[requests.exceptions.RequestException], max_tries=3, delay=1.0, backoff=2.0)
    def bulk_create_records(self, table_id: str, records: List[dict]) -> dict:
        """Creates multiple records in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            records (List[dict]): List of records to create

        Returns:
            dict: Created records metadata
            
        Raises:
            QuickbaseError: If creation fails
            
        Note:
            This method uses retry logic to handle transient errors
            The method also clears any cached queries for this table
        """
        try:
            payload = {
                "to": table_id,
                "data": records
            }
            response = self._request("POST", "records", json=payload)
            result = self._handle_response(response)
            
            # Clear cache for this table
            if self.use_cache:
                # Create a pattern to clear all keys related to this table
                pattern = f"_{table_id}"
                field_cache.clear_pattern(pattern)
                
            return result
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to bulk create records: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to bulk create records: {str(e)}")

    @retry(exceptions=[requests.exceptions.RequestException], max_tries=3, delay=1.0, backoff=2.0)
    def bulk_update_records(self, table_id: str, records: List[dict]) -> dict:
        """Updates multiple records in a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            records (List[dict]): List of records to update

        Returns:
            dict: Updated records metadata
            
        Raises:
            QuickbaseError: If update fails
            
        Note:
            This method uses retry logic to handle transient errors
            The method also clears any cached queries for this table
        """
        try:
            payload = {
                "to": table_id,
                "data": records
            }
            response = self._request("POST", "records", json=payload)
            result = self._handle_response(response)
            
            # Clear cache for this table
            if self.use_cache:
                # Create a pattern to clear all keys related to this table
                pattern = f"_{table_id}"
                field_cache.clear_pattern(pattern)
                
            return result
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to bulk update records: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to bulk update records: {str(e)}")

    @retry(exceptions=[requests.exceptions.RequestException], max_tries=3, delay=1.0, backoff=2.0)
    def bulk_delete_records(self, table_id: str, record_ids: List[int]) -> bool:
        """Deletes multiple records from a Quickbase table.

        Args:
            table_id (str): The ID of the Quickbase table
            record_ids (List[int]): List of record IDs to delete

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If deletion fails
            
        Note:
            This method uses retry logic to handle transient errors
            The method also clears any cached queries for this table
        """
        try:
            record_ids_str = "','".join(map(str, record_ids))
            payload = {
                "from": table_id,
                "where": f"{3}.EX.'{record_ids_str}'"  # Record ID field
            }
            response = self._request("DELETE", "records", json=payload)
            self._handle_response(response)
            
            # Clear cache for this table
            if self.use_cache:
                # Create a pattern to clear all keys related to this table
                pattern = f"_{table_id}"
                field_cache.clear_pattern(pattern)
                
            return True
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to bulk delete records: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to bulk delete records: {str(e)}")

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
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure numeric IDs
            if isinstance(record_id, str):
                record_id = int(record_id)
            if isinstance(field_id, str):
                field_id = int(field_id)
                
            # Get the filename from the path
            import os
            filename = os.path.basename(file_path)
            
            # Open the file for reading in binary mode
            with open(file_path, 'rb') as f:
                file_content = f.read()
                
            # Set up headers for the multipart/form-data request
            # Remove the default content-type header
            headers = self.session.headers.copy()
            if 'Content-Type' in headers:
                del headers['Content-Type']
                
            # Import requests and multipart tools
            import requests
            from requests_toolbelt import MultipartEncoder
            
            # According to the API documentation, the correct endpoint is /files/{tableId}/{recordId}/{fieldId}/{versionNumber}
            # We'll use version 0 for new files
            version = 0
            
            # Use MultipartEncoder for proper multipart form handling
            multipart_data = MultipartEncoder(
                fields={
                    'file': (filename, file_content, 'application/octet-stream')
                }
            )
            
            # Set the proper content-type header
            headers = self.session.headers.copy()
            headers['Content-Type'] = multipart_data.content_type
            
            # Build URL
            url = f"{self.base_url}/files/{table_id}/{record_id}/{field_id}/{version}"
            
            # Send the request with properly encoded multipart data
            response = requests.post(
                url,
                data=multipart_data,
                headers=headers
            )
            
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to upload file: {str(e)}")

    def download_file(self, table_id: str, record_id: int, field_id: int, version: int = 0) -> bytes:
        """Downloads a file from QuickBase.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID
            field_id (int): The field ID containing the file
            version (int, optional): The version of the file to download. Defaults to 0 (latest).

        Returns:
            bytes: File contents
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure numeric IDs
            if isinstance(record_id, str):
                record_id = int(record_id)
            if isinstance(field_id, str):
                field_id = int(field_id)
            if isinstance(version, str):
                version = int(version)
                
            # According to the API documentation, the correct endpoint is /files/{tableId}/{recordId}/{fieldId}/{versionNumber}
            response = self.session.get(f"{self.base_url}/files/{table_id}/{record_id}/{field_id}/{version}")
            # Don't try to parse as JSON, as the response is binary
            response.raise_for_status()
            return response.content
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json() if e.response.content else {}
            except:
                error_data = {"error": str(e)}
                
            raise QuickbaseError(
                f"Failed to download file: {str(e)}",
                status_code,
                error_data
            )
        except Exception as e:
            raise QuickbaseError(f"Failed to download file: {str(e)}")

    def delete_file(self, table_id: str, record_id: int, field_id: int, version: int = 0) -> bool:
        """Deletes a file from QuickBase.

        Args:
            table_id (str): The ID of the Quickbase table
            record_id (int): The record ID
            field_id (int): The field ID containing the file
            version (int, optional): The version of the file to delete. Defaults to 0 (latest).

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure numeric IDs
            if isinstance(record_id, str):
                record_id = int(record_id)
            if isinstance(field_id, str):
                field_id = int(field_id)
            if isinstance(version, str):
                version = int(version)
                
            # According to the API documentation, the correct endpoint is /files/{tableId}/{recordId}/{fieldId}/{versionNumber}
            response = self.session.delete(f"{self.base_url}/files/{table_id}/{record_id}/{field_id}/{version}")
            self._handle_response(response)
            return True
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to delete file: {str(e)}")

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
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"app_{app_id}"
            cached_app = app_cache.get(cache_key)
            if cached_app is not None:
                self.logger.debug(f"Cache hit for app: {app_id}")
                return cached_app
                
        try:
            response = self._request("GET", f"apps/{app_id}")
            app_data = self._handle_response(response)
            
            # Cache the app data
            if self.use_cache:
                app_cache.set(f"app_{app_id}", app_data)
                
            return app_data
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get app: {str(e)}")

    def create_app(self, name: str, description: Optional[str] = None, options: Optional[dict] = None) -> dict:
        """Creates a new QuickBase application.

        Args:
            name (str): Name of the application
            description (Optional[str]): Description of the application
            options (Optional[dict]): Additional options for app creation

        Returns:
            dict: Created application information
            
        Raises:
            QuickbaseError: If creation fails
        """
        try:
            payload = {
                "name": name,
                "description": description or "",
                **(options or {})
            }
            response = self.session.post(f"{self.base_url}/apps", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to create app: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to create app: {str(e)}")

    def update_app(self, app_id: str, name: Optional[str] = None, description: Optional[str] = None, options: Optional[dict] = None) -> dict:
        """Updates an existing QuickBase application.

        Args:
            app_id (str): The ID of the application
            name (Optional[str]): New name for the application
            description (Optional[str]): New description for the application
            options (Optional[dict]): Additional options for app update

        Returns:
            dict: Updated application information
            
        Raises:
            QuickbaseError: If update fails
        """
        try:
            payload = {}
            if name:
                payload["name"] = name
            if description is not None:
                payload["description"] = description
            if options:
                payload.update(options)

            response = self.session.patch(f"{self.base_url}/apps/{app_id}", json=payload)
            response.raise_for_status()
            
            # Get the updated app details
            app_response = self.session.get(f"{self.base_url}/apps/{app_id}")
            app_response.raise_for_status()
            return app_response.json()
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to update app: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to update app: {str(e)}")

    def delete_app(self, app_id: str) -> bool:
        """Deletes a QuickBase application.

        Args:
            app_id (str): The ID of the application

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If deletion fails
        """
        try:
            response = self.session.delete(f"{self.base_url}/apps/{app_id}")
            response.raise_for_status()
            return True
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to delete app: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to delete app: {str(e)}")
            
    def copy_app(self, app_id: str, name: str, description: str = None, properties: dict = None) -> dict:
        """Copies a QuickBase application.

        Args:
            app_id (str): The ID of the source application
            name (str): The name for the new application
            description (str, optional): Description for the new application
            properties (dict, optional): Additional properties for the new application

        Returns:
            dict: The newly created application's details
        """
        try:
            payload = {
                "name": name,
                "sourceAppId": app_id
            }
            
            if description:
                payload["description"] = description
                
            if properties:
                payload.update(properties)
                
            response = self.session.post(f"{self.base_url}/apps/copy", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to copy app: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to copy app: {str(e)}")

    def get_app_tables(self, app_id: str) -> list[dict]:
        """Retrieves tables in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of tables in the application
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"app_tables_{app_id}"
            cached_tables = app_cache.get(cache_key)
            if cached_tables is not None:
                self.logger.debug(f"Cache hit for app tables: {app_id}")
                return cached_tables
                
        try:
            response = self._request("GET", f"apps/{app_id}/tables")
            tables = self._handle_response(response)
            
            # Cache the tables
            if self.use_cache:
                app_cache.set(f"app_tables_{app_id}", tables)
                
            return tables
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get app tables: {str(e)}")

    def get_app_roles(self, app_id: str) -> list[dict]:
        """Retrieves roles in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of roles in the application
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"app_roles_{app_id}"
            cached_roles = app_cache.get(cache_key)
            if cached_roles is not None:
                self.logger.debug(f"Cache hit for app roles: {app_id}")
                return cached_roles
                
        try:
            response = self._request("GET", f"apps/{app_id}/roles")
            roles = self._handle_response(response)
            
            # Cache the roles
            if self.use_cache:
                app_cache.set(f"app_roles_{app_id}", roles)
                
            return roles
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get app roles: {str(e)}")

    # Form Operations
    def get_form(self, table_id: str, form_id: str) -> dict:
        """Retrieves form information.

        Args:
            table_id (str): The ID of the table
            form_id (str): The ID of the form

        Returns:
            dict: Form information
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"form_{table_id}_{form_id}"
            cached_form = table_cache.get(cache_key)
            if cached_form is not None:
                self.logger.debug(f"Cache hit for form: {table_id}/{form_id}")
                return cached_form
                
        try:
            response = self._request("GET", f"forms/{table_id}/{form_id}")
            form = self._handle_response(response)
            
            # Cache the form
            if self.use_cache:
                table_cache.set(f"form_{table_id}_{form_id}", form)
                
            return form
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get form: {str(e)}")

    def get_table_forms(self, table_id: str) -> list[dict]:
        """Retrieves forms for a table.

        Args:
            table_id (str): The ID of the table

        Returns:
            list[dict]: List of forms for the table
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"table_forms_{table_id}"
            cached_forms = table_cache.get(cache_key)
            if cached_forms is not None:
                self.logger.debug(f"Cache hit for table forms: {table_id}")
                return cached_forms
                
        try:
            response = self._request("GET", f"tables/{table_id}/forms")
            forms = self._handle_response(response)
            
            # Cache the forms
            if self.use_cache:
                table_cache.set(f"table_forms_{table_id}", forms)
                
            return forms
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get table forms: {str(e)}")
            return []

    # Dashboard Operations
    def get_dashboard(self, dashboard_id: str) -> dict:
        """Retrieves dashboard information.

        Args:
            dashboard_id (str): The ID of the dashboard

        Returns:
            dict: Dashboard information
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"dashboard_{dashboard_id}"
            cached_dashboard = app_cache.get(cache_key)
            if cached_dashboard is not None:
                self.logger.debug(f"Cache hit for dashboard: {dashboard_id}")
                return cached_dashboard
                
        try:
            response = self._request("GET", f"dashboards/{dashboard_id}")
            dashboard = self._handle_response(response)
            
            # Cache the dashboard
            if self.use_cache:
                app_cache.set(f"dashboard_{dashboard_id}", dashboard)
                
            return dashboard
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get dashboard: {str(e)}")

    def get_app_dashboards(self, app_id: str) -> list[dict]:
        """Retrieves dashboards in an application.

        Args:
            app_id (str): The ID of the application

        Returns:
            list[dict]: List of dashboards in the application
            
        Raises:
            QuickbaseError: If the API request fails
        """
        # Check cache first if caching is enabled
        if self.use_cache:
            cache_key = f"app_dashboards_{app_id}"
            cached_dashboards = app_cache.get(cache_key)
            if cached_dashboards is not None:
                self.logger.debug(f"Cache hit for app dashboards: {app_id}")
                return cached_dashboards
                
        try:
            response = self._request("GET", f"apps/{app_id}/dashboards")
            dashboards = self._handle_response(response)
            
            # Cache the dashboards
            if self.use_cache:
                app_cache.set(f"app_dashboards_{app_id}", dashboards)
                
            return dashboards
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to get app dashboards: {str(e)}")

    # Table Operations
    def create_table(self, app_id: str, name: str, description: Optional[str] = None, fields: Optional[List[dict]] = None, options: Optional[dict] = None) -> dict:
        """Creates a new table in a QuickBase application.

        Args:
            app_id (str): The ID of the application
            name (str): Name of the table
            description (Optional[str]): Description of the table
            fields (Optional[List[dict]]): List of field definitions
            options (Optional[dict]): Additional options for table creation

        Returns:
            dict: Created table information
        """
        try:
            # Format fields to match QuickBase API requirements
            formatted_fields = []
            if fields:
                for field in fields:
                    formatted_field = {
                        "fieldType": field.get("type", "text"),  # Default to text if not specified
                        "label": field.get("name", ""),
                        "description": field.get("description", ""),
                        "properties": field.get("properties", {})
                    }
                    formatted_fields.append(formatted_field)

            payload = {
                "name": name,
                "description": description or "",
                "fields": formatted_fields,
                **(options or {})
            }
            
            # Send appId as a query parameter
            response = self.session.post(f"{self.base_url}/tables?appId={app_id}", json=payload)
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to create table: {str(e)}")

    def update_table(self, table_id: str, name: Optional[str] = None, description: Optional[str] = None, options: Optional[dict] = None) -> dict:
        """Updates an existing QuickBase table.

        Args:
            table_id (str): The ID of the table
            name (Optional[str]): New name for the table
            description (Optional[str]): New description for the table
            options (Optional[dict]): Additional options for table update

        Returns:
            dict: Updated table information
            
        Raises:
            QuickbaseError: If update fails
        """
        try:
            payload = {}
            if name:
                payload["name"] = name
            if description is not None:
                payload["description"] = description
            if options:
                payload.update(options)

            response = self.session.patch(f"{self.base_url}/tables/{table_id}", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to update table: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to update table: {str(e)}")

    def delete_table(self, table_id: str) -> bool:
        """Deletes a QuickBase table.

        Args:
            table_id (str): The ID of the table

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If deletion fails
        """
        try:
            response = self.session.delete(f"{self.base_url}/tables/{table_id}")
            response.raise_for_status()
            return True
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
            except:
                pass
            
            raise QuickbaseError(
                message=f"Failed to delete table: {error_message}",
                status_code=status_code,
                response=e.response
            )
        except Exception as e:
            raise QuickbaseError(message=f"Failed to delete table: {str(e)}")

    def create_field(self, table_id: str, field_name: str, field_type: str, options: Optional[dict] = None) -> dict:
        """Creates a new field in a QuickBase table.

        Args:
            table_id (str): The ID of the table
            field_name (str): Name of the field
            field_type (str): Type of the field (e.g., "text", "number", "date", etc.)
            options (Optional[dict]): Additional field options

        Returns:
            dict: Created field information
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Format payload to match QuickBase API requirements
            payload = {
                "label": field_name,
                "fieldType": field_type,
                "properties": options.get("properties", {}),
                **(options or {})
            }
            # Use the query parameter format for table_id
            response = self.session.post(f"{self.base_url}/fields?tableId={table_id}", json=payload)
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to create field: {str(e)}")

    def update_field(self, table_id: str, field_id: int, name: Optional[str] = None, field_type: Optional[str] = None, options: Optional[dict] = None) -> dict:
        """Updates an existing field in a QuickBase table.

        Args:
            table_id (str): The ID of the table
            field_id (int): The ID of the field
            name (Optional[str]): New name for the field
            field_type (Optional[str]): New type for the field
            options (Optional[dict]): Additional field options

        Returns:
            dict: Updated field information
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure field_id is an integer
            if isinstance(field_id, str):
                field_id = int(field_id)
                
            # Get current field info to determine the field type if not provided
            if not field_type:
                get_field_response = self.session.get(f"{self.base_url}/fields?tableId={table_id}")
                fields_data = self._handle_response(get_field_response)
                
                # Find the specific field
                target_field = None
                for field in fields_data:
                    if field.get("id") == field_id:
                        target_field = field
                        break
                        
                if not target_field:
                    raise QuickbaseError(f"Field with ID {field_id} not found in table {table_id}")
                
                field_type = target_field.get("fieldType", "text")
            
            # First create a complete field object to modify
            update_payload = {}
            
            # Add required properties
            update_payload["fieldType"] = field_type
            
            # Add label if provided
            if name:
                update_payload["label"] = name
                
            # Add optional properties
            if options:
                for key, value in options.items():
                    update_payload[key] = value
            
            # Make the API call to update the field
            # According to QuickBase's API documentation, POST is used for field updates to /fields/{fieldId}
            url = f"{self.base_url}/fields/{field_id}?tableId={table_id}"
            response = self.session.post(url, json=update_payload)
            return self._handle_response(response)
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to update field: {str(e)}")

    def delete_field(self, table_id: str, field_id: int) -> bool:
        """Deletes a field from a QuickBase table.

        Args:
            table_id (str): The ID of the table
            field_id (int): The ID of the field

        Returns:
            bool: True if deletion successful
            
        Raises:
            QuickbaseError: If the API request fails
        """
        try:
            # Ensure field_id is an integer
            if isinstance(field_id, str):
                field_id = int(field_id)
                
            url = f"{self.base_url}/fields?tableId={table_id}"
            payload = {
                "fieldIds": [field_id]
            }
            response = self.session.delete(url, json=payload)
            self._handle_response(response)
            return True
        except QuickbaseError:
            raise
        except Exception as e:
            raise QuickbaseError(f"Failed to delete field: {str(e)}")

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
            uri="quickbase://tables",
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
            uri="quickbase://reports",
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
            uri="quickbase://forms",
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
        # Connection Operations
        types.Tool(
            name="test_connection",
            description="Tests the connection to Quickbase",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        types.Tool(
            name="configure_cache",
            description="Configures caching behavior for Quickbase operations",
            inputSchema={
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "Whether to enable caching (default: true)"
                    },
                    "clear": {
                        "type": "boolean",
                        "description": "Whether to clear all existing caches (default: false)"
                    }
                },
            },
        ),
        
        # App Operations
        types.Tool(
            name="create_app",
            description="Creates a new QuickBase application",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the application",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the application",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for app creation",
                        "additionalProperties": True,
                    }
                },
                "required": ["name"],
            },
        ),
        types.Tool(
            name="update_app",
            description="Updates an existing QuickBase application",
            inputSchema={
                "type": "object",
                "properties": {
                    "app_id": {
                        "type": "string",
                        "description": "The ID of the application",
                    },
                    "name": {
                        "type": "string",
                        "description": "New name for the application",
                    },
                    "description": {
                        "type": "string",
                        "description": "New description for the application",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for app update",
                        "additionalProperties": True,
                    }
                },
                "required": ["app_id"],
            },
        ),
        types.Tool(
            name="delete_app",
            description="Deletes a QuickBase application",
            inputSchema={
                "type": "object",
                "properties": {
                    "app_id": {
                        "type": "string",
                        "description": "The ID of the application",
                    }
                },
                "required": ["app_id"],
            },
        ),
        types.Tool(
            name="copy_app",
            description="Copies a QuickBase application",
            inputSchema={
                "type": "object",
                "properties": {
                    "app_id": {
                        "type": "string",
                        "description": "The ID of the source application to copy",
                    },
                    "name": {
                        "type": "string",
                        "description": "Name for the new application",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description for the new application",
                    },
                    "properties": {
                        "type": "object",
                        "description": "Additional properties for the new application",
                        "additionalProperties": True,
                    }
                },
                "required": ["app_id", "name"],
            },
        ),
        
        # Table Operations
        types.Tool(
            name="list_tables",
            description="Lists all tables in the Quickbase application",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        types.Tool(
            name="create_table",
            description="Creates a new table in a QuickBase application",
            inputSchema={
                "type": "object",
                "properties": {
                    "app_id": {
                        "type": "string",
                        "description": "The ID of the application",
                    },
                    "name": {
                        "type": "string",
                        "description": "Name of the table",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the table",
                    },
                    "fields": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "type": {"type": "string"},
                                "description": {"type": "string"},
                                "properties": {"type": "object"}
                            },
                            "required": ["name", "type"]
                        },
                        "description": "List of field definitions",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for table creation",
                        "additionalProperties": True,
                    }
                },
                "required": ["app_id", "name"],
            },
        ),
        types.Tool(
            name="update_table",
            description="Updates an existing QuickBase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table",
                    },
                    "name": {
                        "type": "string",
                        "description": "New name for the table",
                    },
                    "description": {
                        "type": "string",
                        "description": "New description for the table",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional options for table update",
                        "additionalProperties": True,
                    }
                },
                "required": ["table_id"],
            },
        ),
        types.Tool(
            name="delete_table",
            description="Deletes a QuickBase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table",
                    }
                },
                "required": ["table_id"],
            },
        ),
        
        # Field Operations
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
            name="create_field",
            description="Creates a new field in a QuickBase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table",
                    },
                    "field_name": {
                        "type": "string",
                        "description": "Name of the field",
                    },
                    "field_type": {
                        "type": "string",
                        "description": "Type of the field (e.g., text, number, date)",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional field options",
                        "additionalProperties": True,
                    }
                },
                "required": ["table_id", "field_name", "field_type"],
            },
        ),
        types.Tool(
            name="update_field",
            description="Updates an existing field in a QuickBase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table",
                    },
                    "field_id": {
                        "type": "string",
                        "description": "The ID of the field",
                    },
                    "name": {
                        "type": "string",
                        "description": "New name for the field",
                    },
                    "field_type": {
                        "type": "string",
                        "description": "New type for the field",
                    },
                    "options": {
                        "type": "object",
                        "description": "Additional field options",
                        "additionalProperties": True,
                    }
                },
                "required": ["table_id", "field_id"],
            },
        ),
        types.Tool(
            name="delete_field",
            description="Deletes a field from a QuickBase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the table",
                    },
                    "field_id": {
                        "type": "string",
                        "description": "The ID of the field",
                    }
                },
                "required": ["table_id", "field_id"],
            },
        ),
        
        # Record Operations
        types.Tool(
            name="query_records",
            description="Executes a query against a Quickbase table with optional pagination",
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
                            "skip": {"type": "integer", "description": "Number of records to skip"},
                            "top": {"type": "integer", "description": "Number of records to retrieve per page"},
                            "groupBy": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Fields to group results by"
                            },
                            "orderBy": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "fieldId": {"type": "string"},
                                        "order": {"type": "string", "enum": ["ASC", "DESC"]}
                                    }
                                },
                                "description": "Fields to order results by"
                            }
                        },
                        "description": "Query options for filtering, ordering, and pagination"
                    },
                    "paginate": {
                        "type": "boolean",
                        "description": "Whether to automatically handle pagination for large result sets",
                    },
                    "max_records": {
                        "type": "string",
                        "description": "Maximum number of records to return when paginating (default: 1000)",
                    }
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
                        "type": "string",
                        "description": "The data for the new record",
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
            name="bulk_create_records",
            description="Creates multiple records in a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "records": {
                        "type": "array",
                        "description": "Array of record data to insert",
                        "items": {
                            "type": "object",
                            "additionalProperties": True
                        }
                    },
                },
                "required": ["table_id", "records"],
            },
        ),
        types.Tool(
            name="bulk_update_records",
            description="Updates multiple records in a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "records": {
                        "type": "array",
                        "description": "Array of record data to update (must include record IDs)",
                        "items": {
                            "type": "object",
                            "additionalProperties": True
                        }
                    },
                },
                "required": ["table_id", "records"],
            },
        ),
        types.Tool(
            name="bulk_delete_records",
            description="Deletes multiple records from a Quickbase table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_ids": {
                        "type": "array",
                        "description": "Array of record IDs to delete",
                        "items": {
                            "type": "string"
                        }
                    },
                },
                "required": ["table_id", "record_ids"],
            },
        ),
        
        # File Operations
        types.Tool(
            name="upload_file",
            description="Uploads a file to a field in a Quickbase record",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record",
                    },
                    "field_id": {
                        "type": "string",
                        "description": "The ID of the field (must be a file attachment field)",
                    },
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to upload",
                    }
                },
                "required": ["table_id", "record_id", "field_id", "file_path"],
            },
        ),
        types.Tool(
            name="download_file",
            description="Downloads a file from a field in a Quickbase record",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record",
                    },
                    "field_id": {
                        "type": "string",
                        "description": "The ID of the field (must be a file attachment field)",
                    },
                    "version": {
                        "type": "string",
                        "description": "The version of the file to download (default 0 for latest)",
                    },
                    "output_path": {
                        "type": "string",
                        "description": "Path where the file should be saved",
                    }
                },
                "required": ["table_id", "record_id", "field_id", "output_path"],
            },
        ),
        types.Tool(
            name="delete_file",
            description="Deletes a file from a field in a Quickbase record",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_id": {
                        "type": "string",
                        "description": "The ID of the Quickbase table",
                    },
                    "record_id": {
                        "type": "string",
                        "description": "The ID of the record",
                    },
                    "field_id": {
                        "type": "string",
                        "description": "The ID of the field (must be a file attachment field)",
                    },
                    "version": {
                        "type": "string",
                        "description": "The version of the file to delete (default 0 for latest)",
                    }
                },
                "required": ["table_id", "record_id", "field_id"],
            },
        ),
        
        # Report Operations
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
        
        # User & Role Operations
        types.Tool(
            name="get_user",
            description="Retrieves user information from Quickbase",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "The ID of the user",
                    }
                },
                "required": ["user_id"],
            },
        ),
        types.Tool(
            name="get_current_user",
            description="Retrieves current user information from Quickbase",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        types.Tool(
            name="get_user_roles",
            description="Retrieves roles for a specific user",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "The ID of the user",
                    }
                },
                "required": ["user_id"],
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
        
        # Form & Dashboard Operations
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
    try:
        if name == "list_tables":
            try:
                app_id = os.getenv('QUICKBASE_APP_ID')
                if not app_id:
                    raise QuickbaseError("Missing QUICKBASE_APP_ID environment variable")
                    
                response = qb_client.session.get(f"{qb_client.base_url}/tables?appId={app_id}")
                tables = qb_client._handle_response(response)
                
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
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error listing tables: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "test_connection":
            try:
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
            except QuickbaseAuthenticationError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Authentication Error: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Connection Error: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "query_records":
            table_id = arguments.get("table_id")
            select = arguments.get("select", [])
            where = arguments.get("where", "")
            options = arguments.get("options", {})
            paginate = arguments.get("paginate", False)
            max_records = int(arguments.get("max_records", 1000))

            if not table_id:
                raise ValueError("Missing 'table_id' argument")

            try:
                results = qb_client.get_table_records(
                    table_id, 
                    query={
                        "from": table_id,
                        "select": select,
                        "where": where,
                        "options": options
                    },
                    paginate=paginate,
                    max_records=max_records
                )
                
                # Format the output for better readability
                record_count = len(results.get("data", []))
                metadata = results.get("metadata", {})
                pagination_info = results.get("pagination", {})
                
                summary = f"Retrieved {record_count} records from table {table_id}"
                if paginate:
                    summary += f" (paginated: {pagination_info.get('total_records_fetched', 0)} records fetched)"
                
                return [
                    types.TextContent(
                        type="text",
                        text=f"{summary}\n\nQuery Results (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error querying records: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error querying records: {str(e)}")
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

            try:
                # Parse the data if it's a string
                if isinstance(data, str):
                    data = json.loads(data)
                
                results = qb_client.create_record(table_id, data)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Create Record Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid data format: {str(e)}")
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error creating record: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "update_record":
            table_id = arguments.get("table_id")
            record_id = arguments.get("record_id")
            data = arguments.get("data")
            if not table_id or not record_id or not data:
                raise ValueError("Missing 'table_id', 'record_id', or 'data' argument")

            try:
                results = qb_client.update_record(table_id, record_id, data)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Update Record Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error updating record: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "delete_record":
            table_id = arguments.get("table_id")
            record_id = arguments.get("record_id")
            if not table_id or not record_id:
                raise ValueError("Missing 'table_id' or 'record_id' argument")

            try:
                results = qb_client.delete_record(table_id, record_id)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Delete Record Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error deleting record: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
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
        elif name == "upload_file":
            table_id = arguments.get("table_id")
            record_id = arguments.get("record_id")
            field_id = arguments.get("field_id")
            file_path = arguments.get("file_path")

            if not table_id or not record_id or not field_id or not file_path:
                raise ValueError("Missing required arguments: table_id, record_id, field_id, and file_path are all required")

            try:
                # Convert IDs to integers if they're strings
                if isinstance(record_id, str):
                    record_id = int(record_id)
                if isinstance(field_id, str):
                    field_id = int(field_id)
                    
                results = qb_client.upload_file(table_id, record_id, field_id, file_path)
                return [
                    types.TextContent(
                        type="text",
                        text=f"File Upload Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error uploading file: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error uploading file: {str(e)}")
                
        elif name == "download_file":
            table_id = arguments.get("table_id")
            record_id = arguments.get("record_id")
            field_id = arguments.get("field_id")
            version = arguments.get("version", 0)
            output_path = arguments.get("output_path")

            if not table_id or not record_id or not field_id or not output_path:
                raise ValueError("Missing required arguments: table_id, record_id, field_id, and output_path are required")

            try:
                # Get the file content
                file_content = qb_client.download_file(table_id, record_id, field_id, version)
                
                # Save the file to the specified path
                with open(output_path, 'wb') as f:
                    f.write(file_content)
                    
                return [
                    types.TextContent(
                        type="text",
                        text=f"File downloaded successfully and saved to: {output_path}"
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error downloading file: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error downloading file: {str(e)}")
                
        elif name == "delete_file":
            table_id = arguments.get("table_id")
            record_id = arguments.get("record_id")
            field_id = arguments.get("field_id")
            version = arguments.get("version", 0)

            if not table_id or not record_id or not field_id:
                raise ValueError("Missing required arguments: table_id, record_id, and field_id are all required")

            try:
                # Convert IDs to integers if they're strings
                if isinstance(record_id, str):
                    record_id = int(record_id)
                if isinstance(field_id, str):
                    field_id = int(field_id)
                if isinstance(version, str):
                    version = int(version)
                    
                result = qb_client.delete_file(table_id, record_id, field_id, version)
                return [
                    types.TextContent(
                        type="text",
                        text=f"File deletion {'successful' if result else 'failed'}"
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error deleting file: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error deleting file: {str(e)}")
                
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
                
            try:
                if action == "upload":
                    # We now have a dedicated upload_file tool
                    field_id = attachment_id  # For backwards compatibility
                    if isinstance(record_id, str):
                        record_id = int(record_id)
                    if isinstance(field_id, str):
                        field_id = int(field_id)
                    results = qb_client.upload_file(table_id, record_id, field_id, file_path)
                    return [
                        types.TextContent(
                            type="text",
                            text=f"File Upload Result (JSON):\n{json.dumps(results, indent=2)}",
                        )
                    ]
                elif action == "download":
                    # We now have a dedicated download_file tool
                    file_content = qb_client.download_file(attachment_id)
                    with open(file_path, 'wb') as f:
                        f.write(file_content)
                    return [
                        types.TextContent(
                            type="text",
                            text=f"File downloaded successfully and saved to: {file_path}"
                        )
                    ]
                elif action == "delete":
                    # We now have a dedicated delete_file tool
                    result = qb_client.delete_file(attachment_id)
                    return [
                        types.TextContent(
                            type="text",
                            text=f"File deletion {'successful' if result else 'failed'}"
                        )
                    ]
                else:
                    raise ValueError(f"Unknown action: {action}")
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error with file operation: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error with file operation: {str(e)}")
        elif name == "manage_users":
            action = arguments.get("action")
            email = arguments.get("email")
            role_id = arguments.get("role_id")
            options = arguments.get("options", {})

            if not action or not email or not role_id:
                raise ValueError("Missing required arguments")

            try:
                results = qb_client.session.post(f"{qb_client.base_url}/users", json={"action": action, "email": email, "roleId": role_id, **options})
                result_json = qb_client._handle_response(results)
                return [
                    types.TextContent(
                        type="text",
                        text=f"User Management Result (JSON):\n{json.dumps(result_json, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error managing users: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error managing users: {str(e)}")
        elif name == "bulk_create_records":
            table_id = arguments.get("table_id")
            records = arguments.get("records")
            
            if not table_id or not records:
                raise ValueError("Missing required arguments: table_id and records")
            
            try:
                # Format the records according to QuickBase API expectations
                formatted_records = []
                for record in records:
                    formatted_record = {}
                    for field_id, value in record.items():
                        # Convert field_id to string if it's an integer
                        field_id_str = str(field_id)
                        formatted_record[field_id_str] = {"value": value}
                    formatted_records.append(formatted_record)
                
                results = qb_client.bulk_create_records(table_id, formatted_records)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Bulk Create Records Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error creating records: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error creating records: {str(e)}")
                
        elif name == "bulk_update_records":
            table_id = arguments.get("table_id")
            records = arguments.get("records")
            
            if not table_id or not records:
                raise ValueError("Missing required arguments: table_id and records")
                
            try:
                # Format the records according to QuickBase API expectations
                formatted_records = []
                for record in records:
                    formatted_record = {}
                    for field_id, value in record.items():
                        # Make sure the record ID (field 3) is included
                        if field_id == "3" or field_id == 3:
                            record_id = value
                            formatted_record["3"] = {"value": record_id}
                        else:
                            # Convert field_id to string if it's an integer
                            field_id_str = str(field_id)
                            formatted_record[field_id_str] = {"value": value}
                    formatted_records.append(formatted_record)
                
                results = qb_client.bulk_update_records(table_id, formatted_records)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Bulk Update Records Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error updating records: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error updating records: {str(e)}")
                
        elif name == "bulk_delete_records":
            table_id = arguments.get("table_id")
            record_ids = arguments.get("record_ids")
            
            if not table_id or not record_ids:
                raise ValueError("Missing required arguments: table_id and record_ids")
                
            try:
                # Convert string IDs to integers if needed
                int_record_ids = []
                for rid in record_ids:
                    if isinstance(rid, str):
                        int_record_ids.append(int(rid))
                    else:
                        int_record_ids.append(rid)
                        
                result = qb_client.bulk_delete_records(table_id, int_record_ids)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Bulk Delete Records Result: {'Success' if result else 'Failed'}"
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error deleting records: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error deleting records: {str(e)}")
                
        elif name == "get_user":
            user_id = arguments.get("user_id")
            
            if not user_id:
                raise ValueError("Missing required argument: user_id")
                
            try:
                result = qb_client.get_user(user_id)
                return [
                    types.TextContent(
                        type="text",
                        text=f"User Information (JSON):\n{json.dumps(result, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error getting user: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error getting user: {str(e)}")
                
        elif name == "get_current_user":
            try:
                result = qb_client.get_current_user()
                return [
                    types.TextContent(
                        type="text",
                        text=f"Current User Information (JSON):\n{json.dumps(result, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error getting current user: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error getting current user: {str(e)}")
                
        elif name == "get_user_roles":
            user_id = arguments.get("user_id")
            
            if not user_id:
                raise ValueError("Missing required argument: user_id")
                
            try:
                result = qb_client.get_user_roles(user_id)
                return [
                    types.TextContent(
                        type="text",
                        text=f"User Roles (JSON):\n{json.dumps(result, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error getting user roles: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error getting user roles: {str(e)}")
                
        elif name == "manage_forms":
            action = arguments.get("action")
            table_id = arguments.get("table_id")
            form_id = arguments.get("form_id")
            form_config = arguments.get("form_config")

            if not action or not table_id or not form_id:
                raise ValueError("Missing required arguments")
            if action == "update" and not form_config:
                raise ValueError("Missing 'form_config' for update action")

            try:
                if action == "get":
                    response = qb_client.session.get(f"{qb_client.base_url}/forms/{table_id}/{form_id}")
                    results = qb_client._handle_response(response)
                else:  # "update"
                    response = qb_client.session.post(f"{qb_client.base_url}/forms/{table_id}/{form_id}", json=form_config)
                    results = qb_client._handle_response(response)
                    
                return [
                    types.TextContent(
                        type="text",
                        text=f"Form Management Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error managing form: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error managing form: {str(e)}")
        elif name == "manage_dashboards":
            action = arguments.get("action")
            dashboard_id = arguments.get("dashboard_id")
            dashboard_config = arguments.get("dashboard_config")
            options = arguments.get("options", {})

            if not action or not dashboard_id:
                raise ValueError("Missing required arguments")
            if action == "update" and not dashboard_config:
                raise ValueError("Missing 'dashboard_config' for update action")

            try:
                if action == "get":
                    response = qb_client.session.get(f"{qb_client.base_url}/dashboards/{dashboard_id}")
                    results = qb_client._handle_response(response)
                else:  # "update"
                    response = qb_client.session.post(
                        f"{qb_client.base_url}/dashboards/{dashboard_id}", 
                        json={"action": action, "dashboard": dashboard_config, **options}
                    )
                    results = qb_client._handle_response(response)
                    
                return [
                    types.TextContent(
                        type="text",
                        text=f"Dashboard Management Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error managing dashboard: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error managing dashboard: {str(e)}")
        elif name == "create_table":
            app_id = arguments.get("app_id")
            name = arguments.get("name")
            description = arguments.get("description")
            fields = arguments.get("fields", [])
            options = arguments.get("options", {})
            if not app_id or not name:
                raise ValueError("Missing 'app_id' or 'name' argument")

            try:
                # Format fields to match QuickBase API requirements
                formatted_fields = []
                if fields:
                    for field in fields:
                        formatted_field = {
                            "fieldType": field.get("type", "text"),  # Default to text if not specified
                            "label": field.get("name", ""),
                            "description": field.get("description", ""),
                            "properties": field.get("properties", {})
                        }
                        formatted_fields.append(formatted_field)

                results = qb_client.create_table(app_id, name, description, formatted_fields, options)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Create Table Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid fields format: {str(e)}")
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error creating table: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "update_table":
            table_id = arguments.get("table_id")
            name = arguments.get("name")
            description = arguments.get("description")
            options = arguments.get("options", {})
            if not table_id:
                raise ValueError("Missing 'table_id' argument")

            results = qb_client.update_table(table_id, name, description, options)
            return [
                types.TextContent(
                    type="text",
                    text=f"Update Table Result (JSON):\n{json.dumps(results, indent=2)}",
                )
            ]
        elif name == "delete_table":
            table_id = arguments.get("table_id")
            if not table_id:
                raise ValueError("Missing 'table_id' argument")

            results = qb_client.delete_table(table_id)
            return [
                types.TextContent(
                    type="text",
                    text=f"Delete Table Result (JSON):\n{json.dumps(results, indent=2)}",
                )
            ]
        elif name == "create_field":
            table_id = arguments.get("table_id")
            field_name = arguments.get("field_name")
            field_type = arguments.get("field_type")
            options = arguments.get("options", {})
            if not table_id or not field_name or not field_type:
                raise ValueError("Missing required arguments")

            try:
                results = qb_client.create_field(table_id, field_name, field_type, options)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Create Field Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error creating field: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "update_field":
            table_id = arguments.get("table_id")
            field_id = arguments.get("field_id")
            name = arguments.get("name")
            field_type = arguments.get("field_type")
            options = arguments.get("options", {})
            if not table_id or not field_id:
                raise ValueError("Missing 'table_id' or 'field_id' argument")

            try:
                results = qb_client.update_field(table_id, field_id, name, field_type, options)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Update Field Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error updating field: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "delete_field":
            table_id = arguments.get("table_id")
            field_id = arguments.get("field_id")
            if not table_id or not field_id:
                raise ValueError("Missing 'table_id' or 'field_id' argument")

            try:
                results = qb_client.delete_field(table_id, field_id)
                return [
                    types.TextContent(
                        type="text",
                        text=f"Delete Field Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error deleting field: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
        elif name == "create_app":
            app_name = arguments.get("name")
            description = arguments.get("description")
            options = arguments.get("options", {})
            
            if not app_name:
                raise ValueError("Missing required argument: 'name' is required")

            try:
                results = qb_client.create_app(app_name, description, options)
                # Convert response to JSON serializable dict if needed
                if hasattr(results, 'json'):
                    results = results.json()
                return [
                    types.TextContent(
                        type="text",
                        text=f"Create App Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error creating app: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error creating app: {str(e)}")

        elif name == "update_app":
            app_id = arguments.get("app_id")
            app_name = arguments.get("name")
            description = arguments.get("description")
            options = arguments.get("options", {})
            
            if not app_id:
                raise ValueError("Missing required argument: 'app_id' is required")

            try:
                # First patch the app
                payload = {}
                if app_name:
                    payload["name"] = app_name
                if description is not None:
                    payload["description"] = description
                if options:
                    payload.update(options)

                response = qb_client.session.patch(f"{qb_client.base_url}/apps/{app_id}", json=payload)
                response.raise_for_status()
                
                # Then get the updated app details
                app_response = qb_client.session.get(f"{qb_client.base_url}/apps/{app_id}")
                app_response.raise_for_status()
                results = app_response.json()
                
                return [
                    types.TextContent(
                        type="text",
                        text=f"Update App Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error updating app: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error updating app: {str(e)}")

        elif name == "delete_app":
            app_id = arguments.get("app_id")
            
            if not app_id:
                raise ValueError("Missing required argument: 'app_id' is required")

            try:
                # Direct call to delete the app
                response = qb_client.session.delete(f"{qb_client.base_url}/apps/{app_id}")
                response.raise_for_status()
                
                return [
                    types.TextContent(
                        type="text",
                        text=f"Delete App Result: Success"
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error deleting app: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error deleting app: {str(e)}")
                
        elif name == "copy_app":
            app_id = arguments.get("app_id")
            app_name = arguments.get("name")
            description = arguments.get("description")
            properties = arguments.get("properties", {})
            
            if not app_id or not app_name:
                raise ValueError("Missing required arguments: 'app_id' and 'name' are required")

            try:
                results = qb_client.copy_app(app_id, app_name, description, properties)
                # Convert response to JSON serializable dict if needed
                if hasattr(results, 'json'):
                    results = results.json()
                return [
                    types.TextContent(
                        type="text",
                        text=f"Copy App Result (JSON):\n{json.dumps(results, indent=2)}",
                    )
                ]
            except QuickbaseError as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error copying app: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error copying app: {str(e)}")
                
        elif name == "configure_cache":
            enabled = arguments.get("enabled", True)
            clear = arguments.get("clear", False)
            
            try:
                # Call the configure_cache method on the client
                qb_client.configure_cache(enabled=enabled, clear=clear)
                
                cache_status = "enabled" if enabled else "disabled"
                clear_status = "cleared" if clear else "preserved"
                
                return [
                    types.TextContent(
                        type="text",
                        text=f"Cache configuration updated successfully. Caching is now {cache_status} and existing caches were {clear_status}."
                    )
                ]
            except Exception as e:
                raise ValueError(f"Error configuring cache: {str(e)}")
                
        raise ValueError(f"Unknown tool: {name}")
    except QuickbaseError as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error: {e.message}\nStatus: {e.status_code}\nDetails: {json.dumps(e.response, indent=2)}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Unexpected error: {str(e)}"
            )
        ]

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