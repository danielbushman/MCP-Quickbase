import { z } from 'zod';
import { createLogger } from './logger';

const logger = createLogger('Validation');

/**
 * Custom validation error with additional context
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly context?: {
      toolName?: string;
      issues?: z.ZodIssue[];
      originalParams?: unknown;
    }
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard for valid JSON Schema objects
 */
function isValidJSONSchema(schema: unknown): schema is Record<string, unknown> {
  return typeof schema === 'object' && 
         schema !== null &&
         'type' in schema;
}

/**
 * Schema cache for performance optimization
 */
class SchemaCache {
  private static cache = new Map<string, z.ZodSchema>();
  private static readonly MAX_SIZE = 100;
  
  static get(key: string): z.ZodSchema | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end for LRU behavior
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  static set(key: string, schema: z.ZodSchema): void {
    // Remove existing key if present (for LRU update)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest entries if cache is full (proper LRU eviction)
    while (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      } else {
        break; // Safety check
      }
    }
    
    this.cache.set(key, schema);
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.MAX_SIZE };
  }
}

/**
 * Convert JSON Schema property to Zod type
 */
function convertPropertyToZod(prop: Record<string, unknown>): z.ZodTypeAny {
  if (!prop || typeof prop !== 'object') {
    logger.warn('Invalid property schema, defaulting to unknown', { prop });
    return z.unknown();
  }

  const { type, enum: enumValues, items, format } = prop;

  // Handle enum constraints
  if (enumValues && Array.isArray(enumValues) && enumValues.length > 0) {
    if (enumValues.every(v => typeof v === 'string')) {
      return z.enum(enumValues as [string, ...string[]]);
    }
    const literals = enumValues.map(v => z.literal(v));
    if (literals.length === 1) {
      return literals[0];
    }
    return z.union([literals[0], literals[1], ...literals.slice(2)]);
  }

  // Handle primitive types
  switch (type) {
    case 'string': {
      let stringSchema = z.string();
      if (format === 'email') stringSchema = stringSchema.email();
      if (format === 'uri') stringSchema = stringSchema.url();
      return stringSchema;
    }
      
    case 'number':
      return z.number();
      
    case 'integer':
      return z.number().int();
      
    case 'boolean':
      return z.boolean();
      
    case 'array':
      if (items && typeof items === 'object') {
        const itemSchema = convertPropertyToZod(items as Record<string, unknown>);
        return z.array(itemSchema);
      }
      return z.array(z.unknown());
      
    case 'object':
      // For nested objects, we'd need recursive handling
      // For now, treat as record of unknown values
      return z.record(z.unknown());
      
    default:
      logger.warn('Unsupported schema type, defaulting to unknown', { type, prop });
      return z.unknown();
  }
}

/**
 * Create Zod schema for MCP server tool registration
 * Returns object with property schemas for MCP server
 */
export function createMcpZodSchema(schema: Record<string, unknown>): Record<string, z.ZodTypeAny> {
  if (!isValidJSONSchema(schema)) {
    logger.warn('Invalid schema provided to createMcpZodSchema', { schema });
    return {};
  }

  if (schema.type !== 'object' || !schema.properties) {
    return {};
  }

  const properties = schema.properties as Record<string, Record<string, unknown>>;
  const required = (schema.required as string[]) || [];
  const zodSchemaObj: Record<string, z.ZodTypeAny> = {};

  try {
    Object.entries(properties).forEach(([key, prop]) => {
      let zodType = convertPropertyToZod(prop);
      
      // Make optional if not in required array
      if (!required.includes(key)) {
        zodType = zodType.optional();
      }
      
      zodSchemaObj[key] = zodType;
    });
  } catch (error) {
    logger.error('Error creating MCP Zod schema', { error, schema });
    return {};
  }

  return zodSchemaObj;
}

/**
 * Create Zod object schema for parameter validation
 * Returns complete Zod schema for validation
 */
export function createValidationSchema(schema: Record<string, unknown>): z.ZodSchema {
  if (!isValidJSONSchema(schema)) {
    logger.warn('Invalid schema provided to createValidationSchema', { schema });
    return z.object({});
  }

  // Create cache key
  const cacheKey = JSON.stringify(schema);
  
  // Check cache first
  const cached = SchemaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let zodSchema: z.ZodSchema;

  try {
    if (schema.type === 'object' && schema.properties) {
      const mcpSchema = createMcpZodSchema(schema);
      zodSchema = z.object(mcpSchema);
    } else {
      // Non-object schemas (rare but possible)
      zodSchema = z.object({});
    }
  } catch (error) {
    logger.error('Error creating validation schema', { error, schema });
    zodSchema = z.object({});
  }

  // Cache the result
  SchemaCache.set(cacheKey, zodSchema);
  
  return zodSchema;
}

/**
 * Validate parameters using JSON Schema with comprehensive error handling
 */
export function validateParams<T>(
  params: unknown, 
  schema: Record<string, unknown>,
  toolName?: string
): T {
  try {
    const zodSchema = createValidationSchema(schema);
    
    logger.debug('Validating parameters', { 
      toolName, 
      paramsType: typeof params,
      schemaType: schema.type 
    });
    
    const result = zodSchema.parse(params);
    
    logger.debug('Parameter validation successful', { toolName });
    
    return result as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const context = toolName ? ` in tool "${toolName}"` : '';
      const issues = error.errors.map(err => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `${path}: ${err.message}`;
      });
      
      const validationError = new ValidationError(
        `Parameter validation failed${context}: ${issues.join(', ')}`,
        {
          toolName,
          issues: error.errors,
          originalParams: params
        }
      );
      
      logger.error('Parameter validation failed', {
        toolName,
        error: validationError.message,
        issues: error.errors,
        params: typeof params === 'object' ? 'object' : params
      });
      
      throw validationError;
    }
    
    logger.error('Unexpected validation error', { error, toolName });
    throw error;
  }
}

// Legacy exports for backward compatibility
export const createZodSchema = createMcpZodSchema;
export const createZodObjectSchema = createValidationSchema;