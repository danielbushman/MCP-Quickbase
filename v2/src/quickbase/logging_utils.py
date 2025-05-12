"""
Logging utilities for the Quickbase connector.
"""
import logging
import json
import re
from typing import Dict, Any


def setup_logger(name: str) -> logging.Logger:
    """
    Set up a logger with the given name.
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger


def redact_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redact sensitive data from a dictionary.
    
    Args:
        data: Dictionary to redact
        
    Returns:
        Redacted dictionary
    """
    result = data.copy()
    
    sensitive_keys = [
        "user_token", "token", "password", "Authorization", 
        "auth", "key", "secret", "credential"
    ]
    
    for key, value in result.items():
        if isinstance(value, dict):
            result[key] = redact_sensitive_data(value)
        elif isinstance(value, list):
            result[key] = [
                redact_sensitive_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, str):
            # Check if this is a sensitive key
            if any(k.lower() in key.lower() for k in sensitive_keys):
                result[key] = "***REDACTED***"
            
            # Check for auth headers
            if key.lower() == "authorization":
                # Keep the auth type but redact the token
                auth_parts = value.split(" ", 1)
                if len(auth_parts) > 1:
                    result[key] = f"{auth_parts[0]} ***REDACTED***"
                else:
                    result[key] = "***REDACTED***"
    
    return result


def log_api_request(logger: logging.Logger, method: str, url: str, 
                    headers: Dict[str, str], data: Any = None) -> None:
    """
    Log an API request with sensitive data redacted.
    
    Args:
        logger: Logger to use
        method: HTTP method
        url: Request URL
        headers: Request headers
        data: Request data
    """
    # Redact sensitive information
    clean_headers = redact_sensitive_data(headers)
    
    log_data = {
        "method": method,
        "url": url,
        "headers": clean_headers
    }
    
    if data:
        if isinstance(data, dict):
            log_data["data"] = redact_sensitive_data(data)
        else:
            # Try to parse as JSON, otherwise use as is
            try:
                json_data = json.loads(data)
                log_data["data"] = redact_sensitive_data(json_data)
            except (json.JSONDecodeError, TypeError):
                log_data["data"] = "***RAW_DATA***"
    
    logger.debug(f"API Request: {json.dumps(log_data)}")