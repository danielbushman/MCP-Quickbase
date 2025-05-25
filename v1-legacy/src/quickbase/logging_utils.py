"""
Logging utilities for the Quickbase MCP integration.
Provides tools to log API requests and responses with appropriate redaction of sensitive data.
"""

import logging
import json
import re
from typing import Dict, Any, Optional, Union

# Configure logger
logger = logging.getLogger(__name__)

# Common sensitive field patterns to redact
SENSITIVE_FIELDS = [
    r"token",
    r"key",
    r"secret",
    r"password",
    r"auth",
    r"credential"
]

def redact_sensitive_data(data: Union[Dict, str], 
                          patterns: Optional[list] = None, 
                          replacement: str = "*****") -> Union[Dict, str]:
    """Redact sensitive data from logs.
    
    Args:
        data (Union[Dict, str]): Data to redact
        patterns (Optional[list]): Regex patterns to match for redaction
        replacement (str): Replacement string for sensitive data
        
    Returns:
        Union[Dict, str]: Redacted data
    """
    if patterns is None:
        patterns = SENSITIVE_FIELDS
    
    if isinstance(data, str):
        # For string data, try to parse as JSON first
        try:
            data_dict = json.loads(data)
            redacted_dict = redact_sensitive_data(data_dict, patterns, replacement)
            return json.dumps(redacted_dict)
        except json.JSONDecodeError:
            # Not JSON, apply regex redaction directly to string
            redacted = data
            for pattern in patterns:
                regex = re.compile(f'("{pattern}\\w*":\\s*")(.*?)(")', re.IGNORECASE)
                redacted = regex.sub(f'\\1{replacement}\\3', redacted)
            return redacted
    
    if not isinstance(data, dict):
        return data
    
    result = {}
    for key, value in data.items():
        # Check if this key matches any sensitive patterns
        if any(re.search(pattern, key, re.IGNORECASE) for pattern in patterns):
            result[key] = replacement
        elif isinstance(value, dict):
            result[key] = redact_sensitive_data(value, patterns, replacement)
        elif isinstance(value, list):
            result[key] = [
                redact_sensitive_data(item, patterns, replacement) 
                if isinstance(item, dict) else item 
                for item in value
            ]
        else:
            result[key] = value
    
    return result

def log_request(method: str, url: str, 
                headers: Optional[Dict[str, str]] = None, 
                data: Optional[Any] = None, 
                level: int = logging.DEBUG) -> None:
    """Log an API request with sensitive data redacted.
    
    Args:
        method (str): HTTP method
        url (str): Request URL
        headers (Optional[Dict[str, str]]): Request headers
        data (Optional[Any]): Request data
        level (int): Logging level
    """
    try:
        # Redact headers and data
        safe_headers = redact_sensitive_data(headers) if headers else {}
        
        # Try to convert data to string for logging if it exists
        safe_data = None
        if data:
            if isinstance(data, dict):
                safe_data = redact_sensitive_data(data)
            elif isinstance(data, str):
                safe_data = redact_sensitive_data(data)
            else:
                try:
                    safe_data = redact_sensitive_data(str(data))
                except:
                    safe_data = "<DATA>"
        
        # Log the request details
        msg = f"API Request: {method} {url}"
        if safe_headers:
            msg += f"\nHeaders: {json.dumps(safe_headers, indent=2)}"
        if safe_data:
            data_str = safe_data
            if isinstance(safe_data, dict):
                data_str = json.dumps(safe_data, indent=2)
            if len(data_str) > 1000:
                data_str = data_str[:1000] + "... [truncated]"
            msg += f"\nData: {data_str}"
        
        logger.log(level, msg)
    except Exception as e:
        logger.warning(f"Error logging request: {e}")

def log_response(response, level: int = logging.DEBUG) -> None:
    """Log an API response with sensitive data redacted.
    
    Args:
        response: Response object
        level (int): Logging level
    """
    try:
        status_code = getattr(response, 'status_code', None)
        url = getattr(response, 'url', None)
        
        msg = f"API Response: {status_code} from {url}"
        
        # Try to get and redact response data
        try:
            if hasattr(response, 'json'):
                data = response.json()
                safe_data = redact_sensitive_data(data)
                data_str = json.dumps(safe_data, indent=2)
                if len(data_str) > 1000:
                    data_str = data_str[:1000] + "... [truncated]"
                msg += f"\nData: {data_str}"
            elif hasattr(response, 'text'):
                text = response.text
                safe_text = redact_sensitive_data(text)
                if len(safe_text) > 1000:
                    safe_text = safe_text[:1000] + "... [truncated]"
                msg += f"\nText: {safe_text}"
        except Exception as e:
            msg += f"\nUnable to parse response data: {e}"
        
        logger.log(level, msg)
    except Exception as e:
        logger.warning(f"Error logging response: {e}")