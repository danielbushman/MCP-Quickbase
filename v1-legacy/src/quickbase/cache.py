"""
Caching utilities for the Quickbase MCP integration.
Provides a simple cache implementation to store frequently accessed data.
"""

import time
import logging
import threading
from typing import Dict, Any, Optional, Tuple, Callable

# Configure logger
logger = logging.getLogger(__name__)

class Cache:
    """Simple in-memory cache with expiration."""
    
    def __init__(self, ttl: int = 300):
        """Initialize the cache.
        
        Args:
            ttl (int): Time-to-live in seconds for cached items (default: 300)
        """
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._ttl = ttl
        self._lock = threading.RLock()
        
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.
        
        Args:
            key (str): Cache key
            
        Returns:
            Optional[Any]: The cached value, or None if not found or expired
        """
        with self._lock:
            if key not in self._cache:
                return None
                
            value, expiry = self._cache[key]
            if expiry < time.time():
                # Expired item
                del self._cache[key]
                return None
                
            return value
            
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache.
        
        Args:
            key (str): Cache key
            value (Any): Value to cache
            ttl (Optional[int]): Custom TTL for this item (in seconds)
        """
        if ttl is None:
            ttl = self._ttl
            
        expiry = time.time() + ttl
        
        with self._lock:
            self._cache[key] = (value, expiry)
            
    def delete(self, key: str) -> None:
        """Delete a value from the cache.
        
        Args:
            key (str): Cache key
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                
    def clear(self) -> None:
        """Clear all items from the cache."""
        with self._lock:
            self._cache.clear()
            
    def clear_pattern(self, pattern: str) -> None:
        """Clear items that match a pattern from the cache.
        
        Args:
            pattern (str): Pattern to match against keys
        """
        with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self._cache[key]


def cached(cache: Cache, key_fn: Callable = None, ttl: Optional[int] = None):
    """Decorator to cache function results.
    
    Args:
        cache (Cache): Cache instance to use
        key_fn (Callable, optional): Function to generate cache key
        ttl (Optional[int], optional): TTL override for cached items
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func):
        def generate_key(*args, **kwargs):
            if key_fn:
                return key_fn(*args, **kwargs)
            # Default key generation based on function name and arguments
            arg_str = ','.join([str(arg) for arg in args])
            kwarg_str = ','.join([f"{k}={v}" for k, v in sorted(kwargs.items())])
            return f"{func.__module__}.{func.__name__}({arg_str},{kwarg_str})"
            
        def wrapper(*args, **kwargs):
            key = generate_key(*args, **kwargs)
            cached_value = cache.get(key)
            
            if cached_value is not None:
                logger.debug(f"Cache hit for {key}")
                return cached_value
                
            logger.debug(f"Cache miss for {key}")
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
            
        return wrapper
    return decorator

# Create a global cache instance with 5-minute TTL
app_cache = Cache(ttl=300)
table_cache = Cache(ttl=300)
field_cache = Cache(ttl=300)