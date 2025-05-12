"""
Caching implementation for Quickbase API responses.
"""
from typing import Any, Dict, Optional, Tuple
import time
import logging
import json
from .logging_utils import setup_logger

logger = setup_logger(__name__)


class Cache:
    """Cache for Quickbase API responses."""
    
    def __init__(self, ttl: int = 3600):
        """
        Initialize the cache.
        
        Args:
            ttl: Time to live for cache entries in seconds (default: 1 hour)
        """
        self.cache: Dict[str, Tuple[float, Any]] = {}
        self.ttl = ttl
        logger.info(f"Cache initialized with TTL of {ttl} seconds")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or expired
        """
        if key not in self.cache:
            return None
            
        timestamp, value = self.cache[key]
        
        # Check if entry is expired
        if time.time() - timestamp > self.ttl:
            logger.debug(f"Cache entry expired for key: {key}")
            del self.cache[key]
            return None
            
        logger.debug(f"Cache hit for key: {key}")
        return value
    
    def set(self, key: str, value: Any) -> None:
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self.cache[key] = (time.time(), value)
        logger.debug(f"Cache set for key: {key}")
    
    def invalidate(self, key: str) -> None:
        """
        Invalidate a cache entry.
        
        Args:
            key: Cache key to invalidate
        """
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Cache entry invalidated for key: {key}")
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
        logger.info("Cache cleared")