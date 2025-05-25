import { validateParams, createMcpZodSchema } from '../utils/validation';

// Mock the logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('Validation Additional Coverage', () => {
  describe('Complex validation scenarios', () => {
    it('should validate deeply nested objects with arrays', () => {
      const schema = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              filters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    operator: { type: 'string' },
                    value: { type: 'string' }
                  },
                  required: ['field', 'operator']
                }
              }
            }
          }
        },
        required: ['metadata']
      };

      const params = {
        metadata: {
          filters: [
            { field: 'name', operator: 'eq', value: 'test' },
            { field: 'status', operator: 'in' }
          ]
        }
      };

      const result = validateParams(params, schema, 'complex_tool');
      expect(result).toEqual(params);
    });

    it('should handle union types in schema', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' }
            ]
          }
        },
        required: ['value']
      };

      const stringParams = { value: 'test' };
      const numberParams = { value: 42 };

      expect(() => validateParams(stringParams, schema, 'union_tool')).not.toThrow();
      expect(() => validateParams(numberParams, schema, 'union_tool')).not.toThrow();
    });

    it('should validate enum values', () => {
      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        },
        required: ['status']
      };

      const validParams = { status: 'active' };
      const result = validateParams(validParams, schema, 'enum_tool');
      expect(result).toEqual(validParams);

      expect(() => {
        validateParams({ status: 'invalid' }, schema, 'enum_tool');
      }).toThrow();
    });

    it('should handle additional properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: false,
        required: ['name']
      };

      const validParams = { name: 'test' };
      expect(() => validateParams(validParams, schema, 'strict_tool')).not.toThrow();

      const invalidParams = { name: 'test', extra: 'field' };
      expect(() => validateParams(invalidParams, schema, 'strict_tool')).toThrow();
    });

    it('should validate format constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          url: {
            type: 'string',
            format: 'uri'
          }
        }
      };

      const validParams = {
        email: 'test@example.com',
        url: 'https://example.com'
      };

      expect(() => validateParams(validParams, schema, 'format_tool')).not.toThrow();
    });

    it('should handle numeric constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            minimum: 0,
            maximum: 100
          },
          rate: {
            type: 'number',
            multipleOf: 0.5
          }
        }
      };

      const validParams = { count: 50, rate: 2.5 };
      expect(() => validateParams(validParams, schema, 'numeric_tool')).not.toThrow();

      const invalidParams = { count: -1, rate: 2.3 };
      expect(() => validateParams(invalidParams, schema, 'numeric_tool')).toThrow();
    });

    it('should validate string length constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          shortString: {
            type: 'string',
            maxLength: 10
          },
          longString: {
            type: 'string',
            minLength: 5
          }
        }
      };

      const validParams = {
        shortString: 'short',
        longString: 'this is long enough'
      };
      expect(() => validateParams(validParams, schema, 'string_tool')).not.toThrow();

      const invalidParams = {
        shortString: 'this is way too long',
        longString: 'no'
      };
      expect(() => validateParams(invalidParams, schema, 'string_tool')).toThrow();
    });

    it('should handle array length constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 3
          }
        }
      };

      const validParams = { tags: ['tag1', 'tag2'] };
      expect(() => validateParams(validParams, schema, 'array_tool')).not.toThrow();

      const emptyParams = { tags: [] };
      expect(() => validateParams(emptyParams, schema, 'array_tool')).toThrow();

      const tooManyParams = { tags: ['tag1', 'tag2', 'tag3', 'tag4'] };
      expect(() => validateParams(tooManyParams, schema, 'array_tool')).toThrow();
    });
  });

  describe('Schema conversion edge cases', () => {
    it('should handle recursive schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#' }
          }
        }
      };

      expect(() => createMcpZodSchema(schema)).not.toThrow();
    });

    it('should handle schemas with references', () => {
      const schema = {
        type: 'object',
        properties: {
          user: { $ref: '#/definitions/User' }
        },
        definitions: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        }
      };

      expect(() => createMcpZodSchema(schema)).not.toThrow();
    });

    it('should handle allOf schemas', () => {
      const schema = {
        allOf: [
          {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          },
          {
            type: 'object',
            properties: {
              age: { type: 'number' }
            }
          }
        ]
      };

      expect(() => createMcpZodSchema(schema)).not.toThrow();
    });

    it('should handle anyOf schemas', () => {
      const schema = {
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      };

      expect(() => createMcpZodSchema(schema)).not.toThrow();
    });
  });

  describe('Error message formatting', () => {
    it('should provide detailed error messages for nested validation failures', () => {
      const schema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            properties: {
              settings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    value: { type: 'number' }
                  },
                  required: ['key', 'value']
                }
              }
            },
            required: ['settings']
          }
        },
        required: ['config']
      };

      const invalidParams = {
        config: {
          settings: [
            { key: 'setting1', value: 42 },
            { key: 'setting2', value: 'not-a-number' }
          ]
        }
      };

      try {
        validateParams(invalidParams, schema, 'nested_error_tool');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Parameter validation failed');
        expect(error.message).toContain('nested_error_tool');
      }
    });

    it('should handle validation errors with custom error messages', () => {
      const schema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            errorMessage: 'Must be a valid email address'
          }
        },
        required: ['email']
      };

      try {
        validateParams({ email: 'invalid-email' }, schema, 'custom_error_tool');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Parameter validation failed');
      }
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large schemas efficiently', () => {
      const properties: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        properties[`field${i}`] = { type: 'string' };
      }

      const schema = {
        type: 'object',
        properties,
        required: Object.keys(properties).slice(0, 50)
      };

      const params: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        params[`field${i}`] = `value${i}`;
      }

      const start = Date.now();
      const result = validateParams(params, schema, 'large_schema_tool');
      const duration = Date.now() - start;

      expect(result).toEqual(params);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle schemas with circular references gracefully', () => {
      const schema: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          parent: null
        }
      };
      
      // Create circular reference
      schema.properties.parent = schema;

      expect(() => createMcpZodSchema(schema)).not.toThrow();
    });

    it('should validate parameters with special characters', () => {
      const schema = {
        type: 'object',
        properties: {
          'field-with-dashes': { type: 'string' },
          'field_with_underscores': { type: 'string' },
          'field.with.dots': { type: 'string' },
          'field with spaces': { type: 'string' }
        }
      };

      const params = {
        'field-with-dashes': 'value1',
        'field_with_underscores': 'value2',
        'field.with.dots': 'value3',
        'field with spaces': 'value4'
      };

      const result = validateParams(params, schema, 'special_chars_tool');
      expect(result).toEqual(params);
    });
  });
});