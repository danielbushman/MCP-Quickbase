import { QueryRecordsTool } from '../../tools/records/query_records';
import { QuickbaseClient } from '../../client/quickbase';
import { ApiResponse } from '../../types/api';

jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('QueryRecordsTool', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;
  let tool: QueryRecordsTool;

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
    tool = new QueryRecordsTool(mockClient);
    jest.clearAllMocks();
  });

  describe('Basic Queries', () => {
    it('should query all records in a table', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '3': { value: 1 }, '6': { value: 'Customer A' } },
            { '3': { value: 2 }, '6': { value: 'Customer B' } }
          ],
          fields: [
            { id: 3, label: 'Record ID#', type: 'recordid' },
            { id: 6, label: 'Customer Name', type: 'text' }
          ],
          metadata: {
            totalRecords: 2,
            numRecords: 2,
            skip: 0,
            top: 200
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should query with specific fields', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '6': { value: 'Customer A' }, '7': { value: 1000 } }
          ],
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          metadata: {
            totalRecords: 1,
            numRecords: 1,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        select: ['6', '7']
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [6, 7],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should query with where clause', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '3': { value: 5 }, '6': { value: 'Big Customer' }, '7': { value: 5000 } }
          ],
          fields: [
            { id: 3, label: 'Record ID#', type: 'recordid' },
            { id: 6, label: 'Customer Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          metadata: {
            totalRecords: 1,
            numRecords: 1,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        where: "{7.GT.2000}"
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: "{7.GT.2000}",
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Sorting and Grouping', () => {
    it('should query with sorting', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '3': { value: 2 }, '7': { value: 5000 } },
            { '3': { value: 1 }, '7': { value: 1000 } }
          ],
          fields: [],
          metadata: {
            totalRecords: 2,
            numRecords: 2,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        orderBy: [
          { fieldId: '7', order: 'DESC' }
        ]
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: [
            { fieldId: '7', order: 'DESC' }
          ],
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should query with grouping', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '10': { value: 'Category A' }, '7': { value: 10000 } },
            { '10': { value: 'Category B' }, '7': { value: 5000 } }
          ],
          fields: [],
          metadata: {
            totalRecords: 2,
            numRecords: 2,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        options: {
          groupBy: [
            { fieldId: 10, grouping: 'equal-values' }
          ]
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: [
            { fieldId: 10, grouping: 'equal-values' }
          ],
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination with skip and max_records', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(10).fill(null).map((_, i) => ({
            '3': { value: i + 11 }
          })),
          fields: [],
          metadata: {
            totalRecords: 50,
            numRecords: 10,
            skip: 10,
            top: 10
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        skip: 10,
        max_records: 10
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 10,
            top: 10,
            returnPercentage: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle automatic pagination when paginate is true', async () => {
      // First page
      const mockResponse1: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(100).fill(null).map((_, i) => ({
            '3': { value: i + 1 }
          })),
          fields: [],
          metadata: {
            totalRecords: 150,
            numRecords: 100,
            skip: 0,
            top: 100
          }
        }
      };

      // Second page
      const mockResponse2: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(50).fill(null).map((_, i) => ({
            '3': { value: i + 101 }
          })),
          fields: [],
          metadata: {
            totalRecords: 150,
            numRecords: 50,
            skip: 100,
            top: 100
          }
        }
      };

      mockClient.request
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        paginate: true
      });

      expect(mockClient.request).toHaveBeenCalledTimes(2);
      
      // First call
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });

      // Second call
      expect(mockClient.request).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 100,
            top: 100,
            returnPercentage: false
          }
        }
      });

      // Result should contain all records
      expect(result.data?.data).toHaveLength(150);
      expect(result.data?.metadata?.totalRecords).toBe(150);
      expect(result.data?.metadata?.numRecords).toBe(150);
    });

    it('should handle pagination with large result sets', async () => {
      // Mock multiple pages of results
      const responses = Array(5).fill(null).map((_, pageIndex) => ({
        success: true,
        data: {
          data: Array(1000).fill(null).map((_, i) => ({
            '3': { value: pageIndex * 1000 + i + 1 }
          })),
          fields: [],
          metadata: {
            totalRecords: 4500,
            numRecords: pageIndex < 4 ? 1000 : 500,
            skip: pageIndex * 1000,
            top: 1000
          }
        }
      }));

      mockClient.request
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2])
        .mockResolvedValueOnce(responses[3])
        .mockResolvedValueOnce(responses[4]);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        paginate: true,
        max_records: 10000
      });

      expect(mockClient.request).toHaveBeenCalledTimes(5);
      expect(result.data?.data).toHaveLength(4500);
    });

    it('should handle pagination with custom max_records limit', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(50).fill(null).map((_, i) => ({
            '3': { value: i + 1 }
          })),
          fields: [],
          metadata: {
            totalRecords: 1000,
            numRecords: 50,
            skip: 0,
            top: 50
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        paginate: true,
        max_records: 50
      });

      expect(mockClient.request).toHaveBeenCalledTimes(1);
      expect(result.data?.data).toHaveLength(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 400,
          message: 'Invalid where clause'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        where: "INVALID"
      })).rejects.toThrow('Invalid where clause');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64'
      })).rejects.toThrow('Failed to query records');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64'
      })).rejects.toThrow('Failed to query records');
    });

    it('should handle pagination errors gracefully', async () => {
      // First page succeeds
      const mockResponse1: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(100).fill(null).map((_, i) => ({
            '3': { value: i + 1 }
          })),
          fields: [],
          metadata: {
            totalRecords: 150,
            numRecords: 100,
            skip: 0,
            top: 100
          }
        }
      };

      // Second page fails
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 500,
          message: 'Server error'
        }
      };

      mockClient.request
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        paginate: true
      })).rejects.toThrow('Server error');
    });
  });

  describe('Advanced Options', () => {
    it('should handle compareWithAppLocalTime option', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [],
          fields: [],
          metadata: {
            totalRecords: 0,
            numRecords: 0,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        options: {
          compareWithAppLocalTime: true
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false,
            compareWithAppLocalTime: true
          }
        }
      });
    });

    it('should handle returnPercentage option', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [],
          fields: [],
          metadata: {
            totalRecords: 0,
            numRecords: 0,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        options: {
          returnPercentage: true
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: true
          }
        }
      });
    });

    it('should handle max_records exceeding API limit', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: Array(1000).fill({ '3': { value: 1 } }),
          fields: [],
          metadata: {
            totalRecords: 1000,
            numRecords: 1000,
            skip: 0,
            top: 1000
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: 5000 // Should be capped at 1000
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [],
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 1000, // Capped at API limit
            returnPercentage: false
          }
        }
      });
    });

    it('should handle complex field selections', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [
            { '3': { value: 1 }, '6': { value: 'Test' }, '7': { value: 100 } }
          ],
          fields: [
            { id: 3, label: 'Record ID#', type: 'recordid' },
            { id: 6, label: 'Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          metadata: {
            totalRecords: 1,
            numRecords: 1,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({
        table_id: 'bp8uqvy64',
        select: ['3', '6', '7']
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 7, 6], // Converted to numbers
          where: undefined,
          sortBy: undefined,
          groupBy: undefined,
          options: {
            skip: 0,
            top: 100,
            returnPercentage: false
          }
        }
      });
    });

    it('should handle invalid API response structure', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: "invalid-structure" // Not an object
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid API response: data is not an object');
    });

    it('should handle response missing data array', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [],
          metadata: {}
          // Missing 'data' array
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Query response does not contain records array');
    });

    it('should handle empty results', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          data: [],
          fields: [],
          metadata: {
            totalRecords: 0,
            numRecords: 0,
            skip: 0,
            top: 100
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        where: "{6.EQ.'NonExistent'}"
      });

      expect(result.data?.data).toHaveLength(0);
      expect(result.data?.metadata?.totalRecords).toBe(0);
    });
  });
});