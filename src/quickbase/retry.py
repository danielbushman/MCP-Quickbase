"""
Retry utility for Quickbase API operations.
Provides decorators to add retry logic for methods that might face transient errors.
"""

import time
import logging
from functools import wraps
from typing import Callable, Type, List, Optional, Any, Dict, Union, Tuple

# Set up logger
logger = logging.getLogger(__name__)

def retry(
    exceptions: Union[Type[Exception], List[Type[Exception]]] = Exception,
    max_tries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    jitter: Optional[float] = 0.1,
    logger_func: Optional[Callable] = None
) -> Callable:
    """
    Retry decorator with exponential backoff for functions that raise specified exceptions.
    
    Args:
        exceptions: The exception(s) to catch and retry on
        max_tries: Maximum number of times to retry the function
        delay: Initial delay between retries in seconds
        backoff: Backoff multiplier (e.g. value of 2 will double the delay each retry)
        jitter: Randomize the delay by jitter * (random value in the range [-1, 1])
        logger_func: Function to use for logging

    Returns:
        The decorated function
    """
    if isinstance(exceptions, list):
        exceptions = tuple(exceptions)
    
    log = logger_func or logger.warning
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            mtries, mdelay = max_tries, delay
            last_exception = None
            
            # Try until we succeed or run out of tries
            while mtries > 0:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    # Check if this is a retryable error (e.g., 429, 500, 502, 503, 504)
                    retryable = False
                    
                    # For HTTP errors, check status code
                    if hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                        status_code = e.response.status_code
                        retryable = status_code in (429, 500, 502, 503, 504)
                    
                    # Do not retry if not a retryable error
                    if not retryable:
                        raise
                    
                    mtries -= 1
                    if mtries <= 0:
                        raise
                    
                    # Store the exception to raise later if we run out of tries
                    last_exception = e
                    
                    # Log the retry
                    msg = f"Retry {max_tries - mtries}/{max_tries} for {func.__name__}: {str(e)}"
                    log(msg)
                    
                    # Calculate delay with jitter
                    sleep_time = mdelay
                    if jitter:
                        import random
                        sleep_time = mdelay + jitter * (random.random() * 2 - 1)
                        sleep_time = max(0, sleep_time)  # Ensure non-negative
                    
                    # Sleep and increase delay for next iteration
                    time.sleep(sleep_time)
                    mdelay *= backoff
                    
            # We've run out of tries, so raise the last exception
            if last_exception:
                raise last_exception
                
            # This shouldn't happen, but just in case
            return None
            
        return wrapper
    
    return decorator