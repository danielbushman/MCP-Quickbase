import { jest } from '@jest/globals';

// Targeted test to achieve 80% coverage by focusing on specific uncovered areas
describe('Targeted Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configure Cache Tool Coverage', () => {
    it('should test configure cache tool execution paths', async () => {
      const { ConfigureCacheTool } = await import('../tools/configure_cache.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = {
        isEnabled: jest.fn().mockReturnValue(true),
        getTtl: jest.fn().mockReturnValue(3600),
        getSize: jest.fn().mockReturnValue(10),
        getHitRate: jest.fn().mockReturnValue(0.85),
        enable: jest.fn(),
        disable: jest.fn(),
        setTtl: jest.fn(),
        clear: jest.fn(),
      } as any;
      
      const tool = new ConfigureCacheTool(mockClient, mockCache);
      
      // Test getting current status
      const statusResult = await tool.execute({});
      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.enabled).toBe(true);
      
      // Test enabling cache
      mockCache.isEnabled.mockReturnValue(false);
      const enableResult = await tool.execute({ enabled: true });
      expect(enableResult.success).toBe(true);
      expect(mockCache.enable).toHaveBeenCalled();
      
      // Test disabling cache
      mockCache.isEnabled.mockReturnValue(true);
      const disableResult = await tool.execute({ enabled: false });
      expect(disableResult.success).toBe(true);
      expect(mockCache.disable).toHaveBeenCalled();
      
      // Test setting TTL
      const ttlResult = await tool.execute({ ttl: 7200 });
      expect(ttlResult.success).toBe(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);
      
      // Test clearing cache
      const clearResult = await tool.execute({ clear: true });
      expect(clearResult.success).toBe(true);
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('File Tools Coverage', () => {
    it('should test upload file tool error paths', async () => {
      const { UploadFileTool } = await import('../tools/files/upload_file.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new UploadFileTool(mockClient, mockCache);
      
      // Test missing file path
      const missingFileResult = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        file_path: '',
      });
      expect(missingFileResult.success).toBe(false);
      expect(missingFileResult.error?.message).toContain('File path is required');
      
      // Test invalid table ID
      const invalidTableResult = await tool.execute({
        table_id: '',
        record_id: '123',
        field_id: '10',
        file_path: '/test/file.pdf',
      });
      expect(invalidTableResult.success).toBe(false);
      expect(invalidTableResult.error?.message).toContain('Table ID is required');
    });

    it('should test download file tool error paths', async () => {
      const { DownloadFileTool } = await import('../tools/files/download_file.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new DownloadFileTool(mockClient, mockCache);
      
      // Test missing output path
      const missingOutputResult = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '10',
        output_path: '',
      });
      expect(missingOutputResult.success).toBe(false);
      expect(missingOutputResult.error?.message).toContain('Output path is required');
      
      // Test missing field ID
      const missingFieldResult = await tool.execute({
        table_id: 'bp8uqvy64',
        record_id: '123',
        field_id: '',
        output_path: '/download/file.pdf',
      });
      expect(missingFieldResult.success).toBe(false);
      expect(missingFieldResult.error?.message).toContain('Field ID is required');
    });
  });

  describe('Query Records Tool Coverage', () => {
    it('should test query records error and edge cases', async () => {
      const { QueryRecordsTool } = await import('../tools/records/query_records.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new QueryRecordsTool(mockClient, mockCache);
      
      // Test empty table ID
      const emptyTableResult = await tool.execute({
        table_id: '',
      });
      expect(emptyTableResult.success).toBe(false);
      expect(emptyTableResult.error?.message).toContain('Table ID is required');
      
      // Test negative max_records
      const negativeMaxResult = await tool.execute({
        table_id: 'bp8uqvy64',
        max_records: -1,
      });
      expect(negativeMaxResult.success).toBe(false);
      expect(negativeMaxResult.error?.message).toContain('max_records must be a positive number');
      
      // Test negative skip
      const negativeSkipResult = await tool.execute({
        table_id: 'bp8uqvy64',
        skip: -1,
      });
      expect(negativeSkipResult.success).toBe(false);
      expect(negativeSkipResult.error?.message).toContain('skip must be a non-negative number');
    });

    it('should test query records with complex parameters', async () => {
      const { QueryRecordsTool } = await import('../tools/records/query_records.js');
      
      const mockClient = {
        request: jest.fn().mockResolvedValue({
          data: [{ '3': { value: 'Record 1' } }],
          fields: [{ id: 3, label: 'Record ID#', type: 'recordid' }],
          metadata: { numRecords: 1, numFields: 1, totalRecords: 1 },
        })
      } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new QueryRecordsTool(mockClient, mockCache);
      
      // Test complex query with all parameters
      const complexResult = await tool.execute({
        table_id: 'bp8uqvy64',
        select: ['6', '7', '8'],
        where: "{6.EX.'test'}",
        orderBy: [{ fieldId: 6, order: 'ASC' }],
        max_records: 100,
        skip: 10,
        options: {
          includeLinkedFields: true,
          compareWithAppLocalTime: true,
        },
      });
      
      expect(complexResult.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/records/query',
        body: {
          from: 'bp8uqvy64',
          select: [3, 6, 7, 8],
          where: "{6.EX.'test'}",
          sortBy: [{ fieldId: 6, order: 'ASC' }],
          options: {
            skip: 10,
            top: 100,
            includeLinkedFields: true,
            compareWithAppLocalTime: true,
          },
        },
      });
    });
  });

  describe('Bulk Records Coverage', () => {
    it('should test bulk create records error paths', async () => {
      const { BulkCreateRecordsTool } = await import('../tools/records/bulk_create_records.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new BulkCreateRecordsTool(mockClient, mockCache);
      
      // Test empty records array
      const emptyRecordsResult = await tool.execute({
        table_id: 'bp8uqvy64',
        records: [],
      });
      expect(emptyRecordsResult.success).toBe(false);
      expect(emptyRecordsResult.error?.message).toContain('Records array is required and must not be empty');
      
      // Test missing table ID
      const missingTableResult = await tool.execute({
        table_id: '',
        records: [{ '6': { value: 'Test' } }],
      });
      expect(missingTableResult.success).toBe(false);
      expect(missingTableResult.error?.message).toContain('Table ID is required');
    });

    it('should test bulk update records error paths', async () => {
      const { BulkUpdateRecordsTool } = await import('../tools/records/bulk_update_records.js');
      
      const mockClient = { request: jest.fn() } as any;
      const mockCache = { get: jest.fn(), set: jest.fn() } as any;
      
      const tool = new BulkUpdateRecordsTool(mockClient, mockCache);
      
      // Test records without IDs
      const noIdRecordsResult = await tool.execute({
        table_id: 'bp8uqvy64',
        records: [{ '6': { value: 'Test' } }], // Missing id field
      });
      expect(noIdRecordsResult.success).toBe(false);
      expect(noIdRecordsResult.error?.message).toContain('Each record must have an id field');
    });
  });

  describe('Utility Functions Coverage', () => {
    it('should test retry utility with custom options', async () => {
      const { retry } = await import('../utils/retry.js');
      
      // Test with custom delay function
      const mockDelayFn = jest.fn().mockResolvedValue(undefined);
      const failThenSuccessFn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('Success');
      
      const result = await retry(failThenSuccessFn, {
        maxAttempts: 3,
        delayMs: 100,
        customDelay: mockDelayFn,
      });
      
      expect(result).toBe('Success');
      expect(mockDelayFn).toHaveBeenCalledWith(100, 1);
      expect(failThenSuccessFn).toHaveBeenCalledTimes(2);
    });

    it('should test validation with edge cases', async () => {
      const { validateParams } = await import('../utils/validation.js');
      
      // Test with undefined params
      expect(() => {
        validateParams(undefined as any, { type: 'object' }, 'test');
      }).toThrow();
      
      // Test with null params
      expect(() => {
        validateParams(null as any, { type: 'object' }, 'test');
      }).toThrow();
      
      // Test with invalid schema
      expect(() => {
        validateParams({}, null as any, 'test');
      }).toThrow();
    });

    it('should test cache service edge cases', async () => {
      const { CacheService } = await import('../utils/cache.js');
      
      // Test with very small TTL
      const cache = new CacheService(0.001, true);
      cache.set('key', 'value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(cache.get('key')).toBeNull();
      
      // Test cache statistics
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss
      
      expect(cache.getSize()).toBe(2);
      expect(cache.getHitRate()).toBe(0.5);
      
      // Test has method
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
      
      // Test delete
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
      expect(cache.getSize()).toBe(1);
    });
  });

  describe('Logger Utility Coverage', () => {
    it('should test logger with different levels and context', async () => {
      const { createLogger, setLogLevel, LogLevel } = await import('../utils/logger.js');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // Test with DEBUG level
        setLogLevel(LogLevel.DEBUG);
        const logger = createLogger('test-component');
        
        logger.debug('Debug message', { data: 'test' });
        logger.info('Info message');
        logger.warn('Warning message');
        logger.error('Error message', { error: 'test error' });
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Test with higher log level
        setLogLevel(LogLevel.ERROR);
        logger.debug('Should not appear');
        logger.info('Should not appear');
        
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });
  });
});