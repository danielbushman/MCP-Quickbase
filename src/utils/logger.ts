/**
 * Logger utility for the Quickbase connector
 */

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Logger interface
 */
export interface Logger {
  error(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  debug(message: string, data?: unknown): void;
}

// Global log level (can be set via environment variable)
let globalLogLevel = process.env.LOG_LEVEL 
  ? (LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO)
  : LogLevel.INFO;

/**
 * Set the global log level
 * @param level New log level
 */
export function setLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

/**
 * Creates a logger with the specified name
 * @param name Logger name
 * @returns Logger instance
 */
export function createLogger(name: string): Logger {
  const formatData = (data: unknown): string => {
    if (data === undefined) return '';
    try {
      return JSON.stringify(redactSensitiveData(data));
    } catch (error) {
      // Safe error message formatting to prevent nested serialization issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `[Unserializable data: ${errorMessage}]`;
    }
  };

  return {
    error(message: string, data?: unknown): void {
      if (globalLogLevel >= LogLevel.ERROR) {
        // Use stderr to avoid interfering with JSON responses on stdout
        process.stderr.write(`[ERROR] ${name}: ${message} ${data ? formatData(data) : ''}\n`);
      }
    },
    
    warn(message: string, data?: unknown): void {
      if (globalLogLevel >= LogLevel.WARN) {
        // Use stderr to avoid interfering with JSON responses on stdout
        process.stderr.write(`[WARN] ${name}: ${message} ${data ? formatData(data) : ''}\n`);
      }
    },
    
    info(message: string, data?: unknown): void {
      if (globalLogLevel >= LogLevel.INFO) {
        // Use stderr to avoid interfering with JSON responses on stdout
        process.stderr.write(`[INFO] ${name}: ${message} ${data ? formatData(data) : ''}\n`);
      }
    },
    
    debug(message: string, data?: unknown): void {
      if (globalLogLevel >= LogLevel.DEBUG) {
        // Use stderr to avoid interfering with JSON responses on stdout
        process.stderr.write(`[DEBUG] ${name}: ${message} ${data ? formatData(data) : ''}\n`);
      }
    }
  };
}

/**
 * Sensitive keys that should be redacted
 */
const SENSITIVE_KEYS = [
  'token', 
  'password', 
  'secret', 
  'auth', 
  'key', 
  'credential',
  'Authorization',
  'QB-USER-TOKEN',
  'userToken',
  'QUICKBASE_USER_TOKEN'
];

/**
 * Redacts sensitive data in objects with circular reference protection
 * @param data Object to redact
 * @returns Redacted object
 */
function redactSensitiveData(data: unknown): unknown {
  const visited = new WeakSet();
  
  function redactRecursive(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Circular reference protection
    if (visited.has(obj)) {
      return '[Circular Reference]';
    }
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => redactRecursive(item));
    }

    const result: Record<string, unknown> = {};
    
    try {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          result[key] = redactRecursive(value);
        } else if (
          typeof value === 'string' &&
          SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))
        ) {
          result[key] = '***REDACTED***';
        } else {
          result[key] = value;
        }
      }
    } catch (error) {
      return '[Unserializable Object]';
    }
    
    return result;
  }
  
  return redactRecursive(data);
}