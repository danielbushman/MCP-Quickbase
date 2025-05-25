import { RunReportTool } from '../../tools/reports/run_report';
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

describe('Report Tools', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
    jest.clearAllMocks();
  });

  describe('RunReportTool', () => {
    let tool: RunReportTool;

    beforeEach(() => {
      tool = new RunReportTool(mockClient);
    });

    it('should run a report successfully', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' },
            { id: 8, label: 'Date', type: 'date' }
          ],
          data: [
            { '6': { value: 'Acme Corp' }, '7': { value: 1000 }, '8': { value: '2024-01-01' } },
            { '6': { value: 'Tech Inc' }, '7': { value: 2500 }, '8': { value: '2024-01-02' } },
            { '6': { value: 'Global LLC' }, '7': { value: 1750 }, '8': { value: '2024-01-03' } }
          ],
          metadata: {
            totalRecords: 3,
            numRecords: 3,
            skip: 0,
            top: 200
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        report_id: 'abcd1234'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/reports/abcd1234/run',
        body: {}
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should run a report with skip and top options', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' }
          ],
          data: [
            { '6': { value: 'Tech Inc' } },
            { '6': { value: 'Global LLC' } }
          ],
          metadata: {
            totalRecords: 10,
            numRecords: 2,
            skip: 1,
            top: 2
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        report_id: 'abcd1234',
        options: {
          skip: 1,
          top: 2
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/reports/abcd1234/run',
        body: {
          skip: 1,
          top: 2
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should run a report with where clause', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          data: [
            { '6': { value: 'Tech Inc' }, '7': { value: 2500 } },
            { '6': { value: 'Big Corp' }, '7': { value: 3000 } }
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
        report_id: 'abcd1234',
        options: {
          filters: { "7": { "GT": 2000 } }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/reports/abcd1234/run',
        body: {
          filters: { "7": { "GT": 2000 } }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should run a report with sort options', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          data: [
            { '6': { value: 'Big Corp' }, '7': { value: 3000 } },
            { '6': { value: 'Tech Inc' }, '7': { value: 2500 } },
            { '6': { value: 'Acme Corp' }, '7': { value: 1000 } }
          ],
          metadata: {
            totalRecords: 3,
            numRecords: 3,
            skip: 0,
            top: 200
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        report_id: 'abcd1234',
        options: {
          sortBy: ['7']
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/reports/abcd1234/run',
        body: {
          sortBy: ['7']
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should run a report with groupBy options', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 10, label: 'Category', type: 'text' },
            { id: 7, label: 'Amount', type: 'numeric' }
          ],
          data: [
            { '10': { value: 'Electronics' }, '7': { value: 5500 } },
            { '10': { value: 'Software' }, '7': { value: 3500 } }
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
        report_id: 'abcd1234',
        options: {
          groupBy: ['10']
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/reports/abcd1234/run',
        body: {
          groupBy: ['10']
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle report not found error', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'Report not found'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({
        report_id: 'nonexistent'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockError);
    });

    it('should handle permission error', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 403,
          message: 'User does not have permission to run this report'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({
        report_id: 'restricted-report'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockError);
    });

    it('should handle empty report results', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          fields: [
            { id: 6, label: 'Customer Name', type: 'text' }
          ],
          data: [],
          metadata: {
            totalRecords: 0,
            numRecords: 0,
            skip: 0,
            top: 200
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        report_id: 'empty-report'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });
});