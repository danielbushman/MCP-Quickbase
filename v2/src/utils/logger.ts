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
  error(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  info(message: string, data?: any): void;
  debug(message: string, data?: any): void;
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
  const formatData = (data: any): string => {
    if (data === undefined) return '';
    try {
      return JSON.stringify(redactSensitiveData(data));
    } catch (error) {
      return `[Unserializable data: ${error}]`;
    }
  };

  return {
    error(message: string, data?: any) {
      if (globalLogLevel >= LogLevel.ERROR) {
        console.error(`[ERROR] ${name}: ${message}`, data ? formatData(data) : '');
      }
    },
    
    warn(message: string, data?: any) {
      if (globalLogLevel >= LogLevel.WARN) {
        console.warn(`[WARN] ${name}: ${message}`, data ? formatData(data) : '');
      }
    },
    
    info(message: string, data?: any) {
      if (globalLogLevel >= LogLevel.INFO) {
        console.info(`[INFO] ${name}: ${message}`, data ? formatData(data) : '');
      }
    },
    
    debug(message: string, data?: any) {
      if (globalLogLevel >= LogLevel.DEBUG) {
        console.debug(`[DEBUG] ${name}: ${message}`, data ? formatData(data) : '');
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
  'Authorization'
];

/**
 * Redacts sensitive data in objects
 * @param data Object to redact
 * @returns Redacted object
 */
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else if (
      typeof value === 'string' &&
      SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))
    ) {
      result[key] = '***REDACTED***';
    } else {
      result[key] = value;
    }
  }
  
  return result;
}