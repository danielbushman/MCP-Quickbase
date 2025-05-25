import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../tools/registry.js');

const mockToolRegistry = {
  getAllTools: jest.fn(),
  getTool: jest.fn(),
};

const mockTools = [
  {
    name: 'test_connection',
    description: 'Test Quickbase connection',
    paramSchema: { type: 'object', properties: {} },
    execute: jest.fn(),
  },
  {
    name: 'create_record',
    description: 'Create a new record',
    paramSchema: {
      type: 'object',
      properties: {
        table_id: { type: 'string' },
        data: { type: 'object' },
      },
      required: ['table_id', 'data'],
    },
    execute: jest.fn(),
  },
];

jest.doMock('../tools/registry.js', () => ({
  toolRegistry: mockToolRegistry,
}));

describe('HTTP Server', () => {
  let app: express.Application;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockToolRegistry.getAllTools.mockReturnValue(mockTools);
    
    const { createHTTPServer } = await import('../server.js');
    app = createHTTPServer();
  });

  describe('GET /tools', () => {
    it('should return list of available tools', async () => {
      const response = await request(app)
        .get('/tools')
        .expect(200);

      expect(response.body).toEqual({
        tools: mockTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.paramSchema,
        })),
      });
    });

    it('should handle empty tools list', async () => {
      mockToolRegistry.getAllTools.mockReturnValue([]);

      const response = await request(app)
        .get('/tools')
        .expect(200);

      expect(response.body).toEqual({
        tools: [],
      });
    });
  });

  describe('POST /tools/:toolName', () => {
    it('should execute tool successfully', async () => {
      const mockResult = {
        success: true,
        data: { connected: true },
      };

      mockToolRegistry.getTool.mockReturnValue(mockTools[0]);
      mockTools[0].execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/tools/test_connection')
        .send({})
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockTools[0].execute).toHaveBeenCalledWith({});
    });

    it('should execute tool with parameters', async () => {
      const mockResult = {
        success: true,
        data: { id: '123' },
      };

      const params = {
        table_id: 'bp8uqvy64',
        data: { name: 'Test Record' },
      };

      mockToolRegistry.getTool.mockReturnValue(mockTools[1]);
      mockTools[1].execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/tools/create_record')
        .send(params)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockTools[1].execute).toHaveBeenCalledWith(params);
    });

    it('should handle tool execution errors', async () => {
      const mockResult = {
        success: false,
        error: { message: 'Connection failed', code: 500 },
      };

      mockToolRegistry.getTool.mockReturnValue(mockTools[0]);
      mockTools[0].execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/tools/test_connection')
        .send({})
        .expect(200);

      expect(response.body).toEqual(mockResult);
    });

    it('should handle unknown tools', async () => {
      mockToolRegistry.getTool.mockReturnValue(null);

      const response = await request(app)
        .post('/tools/unknown_tool')
        .send({})
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tool unknown_tool not found',
      });
    });

    it('should handle tool execution exceptions', async () => {
      mockToolRegistry.getTool.mockReturnValue(mockTools[0]);
      mockTools[0].execute.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/tools/test_connection')
        .send({})
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error: Unexpected error',
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/tools/test_connection')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toContain('Invalid JSON');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });
  });

  describe('Error handling middleware', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Route not found',
      });
    });
  });

  describe('CORS and security headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/tools/test_connection')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });
});