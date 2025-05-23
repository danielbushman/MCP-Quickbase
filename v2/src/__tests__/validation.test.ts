import { 
  validateParams, 
  createMcpZodSchema, 
  createValidationSchema,
  ValidationError 
} from '../utils/validation';

describe('Validation System', () => {
  describe('createMcpZodSchema', () => {
    it('should handle empty schema', () => {
      const schema = {};
      const result = createMcpZodSchema(schema);
      expect(result).toEqual({});
    });

    it('should handle invalid schema', () => {
      const schema = null as any;
      const result = createMcpZodSchema(schema);
      expect(result).toEqual({});
    });

    it('should create schema for string properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          optional: { type: 'string' }
        },
        required: ['name']
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('optional');
    });

    it('should handle enum constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          format: { 
            type: 'string',
            enum: ['JSON', 'CSV', 'XML']
          }
        }
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('format');
    });

    it('should handle array properties', () => {
      const schema = {
        type: 'object',
        properties: {
          tags: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('tags');
    });

    it('should handle number and integer types', () => {
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'number' },
          id: { type: 'integer' },
          active: { type: 'boolean' }
        }
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('active');
    });
  });

  describe('validateParams', () => {
    it('should validate valid parameters', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const params = { name: 'John', age: 30 };
      const result = validateParams(params, schema, 'test_tool');
      
      expect(result).toEqual(params);
    });

    it('should reject missing required parameters', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };

      const params = {};
      
      expect(() => {
        validateParams(params, schema, 'test_tool');
      }).toThrow(ValidationError);
    });

    it('should reject wrong parameter types', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' }
        },
        required: ['age']
      };

      const params = { age: 'not a number' };
      
      expect(() => {
        validateParams(params, schema, 'test_tool');
      }).toThrow(ValidationError);
    });

    it('should validate enum constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          format: { 
            type: 'string',
            enum: ['JSON', 'CSV']
          }
        },
        required: ['format']
      };

      // Valid enum value should pass
      const validParams = { format: 'JSON' };
      const result = validateParams(validParams, schema, 'test_tool');
      expect(result).toEqual(validParams);

      // Invalid enum value should fail
      const invalidParams = { format: 'XML' };
      expect(() => {
        validateParams(invalidParams, schema, 'test_tool');
      }).toThrow(ValidationError);
    });

    it('should provide detailed error context', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };

      const params = {};
      
      try {
        validateParams(params, schema, 'test_tool');
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context?.toolName).toBe('test_tool');
        expect(validationError.context?.issues).toBeDefined();
        expect(validationError.message).toContain('test_tool');
      }
    });

    it('should handle array validation', () => {
      const schema = {
        type: 'object',
        properties: {
          tags: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const validParams = { tags: ['tag1', 'tag2'] };
      const result = validateParams(validParams, schema, 'test_tool');
      expect(result).toEqual(validParams);

      const invalidParams = { tags: [123, 'tag2'] };
      expect(() => {
        validateParams(invalidParams, schema, 'test_tool');
      }).toThrow(ValidationError);
    });
  });

  describe('Schema Caching', () => {
    it('should cache validation schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      // First call creates the schema
      const schema1 = createValidationSchema(schema);
      // Second call should return cached schema
      const schema2 = createValidationSchema(schema);
      
      expect(schema1).toBe(schema2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed schemas gracefully', () => {
      const malformedSchemas = [
        undefined,
        null,
        { type: 'invalid' },
        { properties: null }
      ];

      malformedSchemas.forEach(schema => {
        expect(() => {
          const result = createMcpZodSchema(schema as any);
          expect(typeof result).toBe('object');
        }).not.toThrow();
      });
    });

    it('should handle null property schemas', () => {
      const schema = {
        type: 'object',
        properties: { field: null }
      };
      
      expect(() => {
        const result = createMcpZodSchema(schema as any);
        expect(result).toHaveProperty('field');
      }).not.toThrow();
    });

    it('should handle empty enum arrays', () => {
      const schema = {
        type: 'object',
        properties: {
          format: { 
            type: 'string',
            enum: []
          }
        }
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('format');
    });

    it('should handle mixed-type enum values', () => {
      const schema = {
        type: 'object',
        properties: {
          value: { 
            enum: ['string', 123, true]
          }
        }
      };
      
      const result = createMcpZodSchema(schema);
      expect(result).toHaveProperty('value');
    });
  });
});