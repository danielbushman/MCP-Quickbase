import { jest } from '@jest/globals';
import { QueryRecordsTool } from '../../tools/records/query_records.js';
import { QuickbaseClient } from '../../client/quickbase.js';
import { CacheService } from '../../utils/cache.js';

jest.mock('../../client/quickbase.js');
jest.mock('../../utils/cache.js');
jest.mock('../../utils/logger.js', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

const mockClient = {
  request: jest.fn(),
} as unknown as jest.Mocked<QuickbaseClient>;

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
} as unknown as jest.Mocked<CacheService>;

describe('QueryRecordsTool Enhanced Coverage', () => {
  let tool: QueryRecordsTool;

  beforeEach(() => {
    jest.clearAllMocks();
    tool = new QueryRecordsTool(mockClient, mockCache);
  });

  describe('pagination edge cases', () => {
    it('should handle pagination when maxRecords exceeds total', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 1' }, '6': { value: 'Value 1' } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 2,
          totalRecords: 1,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.metadata?.totalRecords).toBe(1);
    });

    it('should handle large record sets with multiple API calls', async () => {
      const firstResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          '3': { value: `Record ${i + 1}` },
          '6': { value: `Value ${i + 1}` },
        })),
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1000,
          numFields: 2,
          totalRecords: 2500,
        },
      };

      const secondResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          '3': { value: `Record ${i + 1001}` },
          '6': { value: `Value ${i + 1001}` },
        })),
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1000,
          numFields: 2,
          totalRecords: 2500,
        },
      };

      const thirdResponse = {
        data: Array.from({ length: 500 }, (_, i) => ({
          '3': { value: `Record ${i + 2001}` },
          '6': { value: `Value ${i + 2001}` },
        })),
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 500,
          numFields: 2,
          totalRecords: 2500,
        },
      };

      mockClient.request
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)
        .mockResolvedValueOnce(thirdResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: 2500,
      });

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(2500);
      expect(mockClient.request).toHaveBeenCalledTimes(3);
      
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6],
          options: { skip: 0, top: 1000 },
        },
      });

      expect(mockClient.request).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6],
          options: { skip: 1000, top: 1000 },
        },
      });

      expect(mockClient.request).toHaveBeenNthCalledWith(3, {
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6],
          options: { skip: 2000, top: 500 },
        },
      });
    });

    it('should handle pagination when exact multiple of 1000', async () => {
      const response = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          '3': { value: `Record ${i + 1}` },
          '6': { value: `Value ${i + 1}` },
        })),
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1000,
          numFields: 2,
          totalRecords: 3000,
        },
      };

      mockClient.request
        .mockResolvedValueOnce({ ...response })
        .mockResolvedValueOnce({ ...response })
        .mockResolvedValueOnce({ ...response });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: 3000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(3000);
      expect(mockClient.request).toHaveBeenCalledTimes(3);
    });
  });

  describe('complex query scenarios', () => {
    it('should handle queries with complex where clauses', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 1' }, '6': { value: 'Active' }, '7': { value: 100 } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Status', type: 'text' },
          { id: 7, label: 'Amount', type: 'currency' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 3,
          totalRecords: 1,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        where: "{6.EX.'Active'} AND {7.GT.50}",
        orderBy: [{ fieldId: 7, order: 'DESC' }],
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6, 7],
          where: "{6.EX.'Active'} AND {7.GT.50}",
          sortBy: [{ fieldId: 7, order: 'DESC' }],
          options: { skip: 0, top: 1000 },
        },
      });
    });

    it('should handle queries with multiple sort fields', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 1' }, '6': { value: 'A' }, '7': { value: 'Category 1' } },
          { '3': { value: 'Record 2' }, '6': { value: 'B' }, '7': { value: 'Category 1' } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
          { id: 7, label: 'Category', type: 'text' },
        ],
        metadata: {
          numRecords: 2,
          numFields: 3,
          totalRecords: 2,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        orderBy: [
          { fieldId: 7, order: 'ASC' },
          { fieldId: 6, order: 'DESC' },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6, 7],
          sortBy: [
            { fieldId: 7, order: 'ASC' },
            { fieldId: 6, order: 'DESC' },
          ],
          options: { skip: 0, top: 1000 },
        },
      });
    });

    it('should handle queries with skip parameter', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 51' }, '6': { value: 'Value 51' } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 2,
          totalRecords: 100,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        skip: 50,
        max_records: 1,
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6],
          options: { skip: 50, top: 1 },
        },
      });
    });
  });

  describe('field selection edge cases', () => {
    it('should handle selection of specific field types', async () => {
      const mockResponse = {
        data: [
          {
            '3': { value: 'Record 1' },
            '6': { value: 'Text Value' },
            '7': { value: 123.45 },
            '8': { value: '2024-01-01' },
            '9': { value: true },
            '10': { value: { filename: 'test.pdf', size: 1024 } },
          },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Text Field', type: 'text' },
          { id: 7, label: 'Number Field', type: 'numeric' },
          { id: 8, label: 'Date Field', type: 'date' },
          { id: 9, label: 'Checkbox Field', type: 'checkbox' },
          { id: 10, label: 'File Field', type: 'file' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 6,
          totalRecords: 1,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        select: ['6', '7', '8', '9', '10'],
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6, 7, 8, 9, 10],
          options: { skip: 0, top: 1000 },
        },
      });
    });

    it('should handle mix of string and number field IDs', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 1' }, '6': { value: 'Text' }, '7': { value: 123 } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Text Field', type: 'text' },
          { id: 7, label: 'Number Field', type: 'numeric' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 3,
          totalRecords: 1,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        select: ['6', 7, '8'], // Mix of strings and numbers
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6, 7, 8],
          options: { skip: 0, top: 1000 },
        },
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle empty result set', async () => {
      const mockResponse = {
        data: [],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 0,
          numFields: 2,
          totalRecords: 0,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        where: '{6.EX.\'NonExistent\'}',
      });

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(0);
      expect(result.data?.metadata?.totalRecords).toBe(0);
    });

    it('should handle API errors during pagination', async () => {
      const firstResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          '3': { value: `Record ${i + 1}` },
          '6': { value: `Value ${i + 1}` },
        })),
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1000,
          numFields: 2,
          totalRecords: 2000,
        },
      };

      mockClient.request
        .mockResolvedValueOnce(firstResponse)
        .mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: 2000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('API rate limit exceeded');
    });

    it('should handle malformed API responses', async () => {
      mockClient.request.mockResolvedValue({
        // Missing required fields
        data: [{ invalid: 'structure' }],
      });

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid response structure');
    });
  });

  describe('options parameter handling', () => {
    it('should handle various options combinations', async () => {
      const mockResponse = {
        data: [
          { '3': { value: 'Record 1' }, '6': { value: 'Value 1' } },
        ],
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 6, label: 'Name', type: 'text' },
        ],
        metadata: {
          numRecords: 1,
          numFields: 2,
          totalRecords: 1,
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        options: {
          compareWithAppLocalTime: true,
          includeAuditInfo: true,
          summarize: false,
        },
      });

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6],
          options: {
            skip: 0,
            top: 1000,
            compareWithAppLocalTime: true,
            includeAuditInfo: true,
            summarize: false,
          },
        },
      });
    });

    it('should merge custom options with pagination', async () => {
      const mockResponse = {
        data: [],
        fields: [],
        metadata: { numRecords: 0, numFields: 0, totalRecords: 0 },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        skip: 100,
        max_records: 50,
        options: {
          includeLinkedFields: true,
          includeAuditInfo: false,
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3],
          options: {
            skip: 100,
            top: 50,
            includeLinkedFields: true,
            includeAuditInfo: false,
          },
        },
      });
    });
  });
});