import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QueryRecordsTool');

/**
 * Order by configuration for query
 */
export interface OrderBy {
  /**
   * Field ID to order by
   */
  fieldId: string;
  
  /**
   * Ordering direction: ASC or DESC
   */
  order: 'ASC' | 'DESC';
}

/**
 * Parameters for query_records tool
 */
export interface QueryRecordsParams {
  /**
   * The ID of the table to query
   */
  table_id: string;
  
  /**
   * WHERE clause for filtering records
   */
  where?: string;
  
  /**
   * Fields to select (field IDs)
   */
  select?: string[];
  
  /**
   * Fields to order by
   */
  orderBy?: OrderBy[];
  
  /**
   * Maximum number of records to return
   */
  max_records?: number;
  
  /**
   * Number of records to skip
   */
  skip?: number;
  
  /**
   * Whether to automatically handle pagination for large result sets
   */
  paginate?: boolean;
  
  /**
   * Additional query options
   */
  options?: Record<string, unknown>;
}

/**
 * Response from querying records
 */
export interface QueryRecordsResult {
  /**
   * Array of records
   */
  records: Record<string, any>[];
  
  /**
   * Total number of records matching the query
   */
  totalRecords?: number;
  
  /**
   * Whether this is a partial result set (more records available)
   */
  hasMore?: boolean;
  
  /**
   * Metadata about the query
   */
  metadata?: {
    /**
     * Fields included in the result
     */
    fields?: Record<string, unknown>[];
    
    /**
     * Table ID that was queried
     */
    tableId: string;
    
    /**
     * Number of records returned
     */
    numRecords: number;
    
    /**
     * Number of records skipped
     */
    skip?: number;
  };
}

/**
 * Tool for querying records from a Quickbase table
 */
export class QueryRecordsTool extends BaseTool<QueryRecordsParams, QueryRecordsResult> {
  public name = 'query_records';
  public description = 'Executes a query against a Quickbase table with optional pagination';
  
  /**
   * Parameter schema for query_records
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the Quickbase table'
      },
      where: {
        type: 'string',
        description: 'Query criteria'
      },
      select: {
        type: 'array',
        description: 'Fields to select',
        items: {
          type: 'string'
        }
      },
      orderBy: {
        type: 'array',
        description: 'Fields to order results by',
        items: {
          type: 'object',
          properties: {
            fieldId: {
              type: 'string'
            },
            order: {
              type: 'string',
              enum: ['ASC', 'DESC']
            }
          }
        }
      },
      max_records: {
        type: 'number',
        description: 'Maximum number of records to return when paginating (default: 1000)'
      },
      skip: {
        type: 'number',
        description: 'Number of records to skip'
      },
      paginate: {
        type: 'boolean',
        description: 'Whether to automatically handle pagination for large result sets'
      },
      options: {
        type: 'object',
        description: 'Query options for filtering, ordering, and pagination'
      }
    },
    required: ['table_id']
  };
  
  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }
  
  /**
   * Run the query_records tool
   * @param params Tool parameters
   * @returns Queried records
   */
  protected async run(params: QueryRecordsParams): Promise<QueryRecordsResult> {
    const { 
      table_id, 
      where, 
      select, 
      orderBy, 
      max_records = 1000, 
      skip = 0, 
      paginate = false,
      options 
    } = params;
    
    logger.info('Querying records from Quickbase table', { 
      tableId: table_id,
      maxRecords: max_records,
      pagination: paginate ? 'enabled' : 'disabled'
    });
    
    // Prepare the query body
    const body: Record<string, any> = {
      from: table_id
    };
    
    // Add where clause if provided
    if (where) {
      body.where = where;
    }
    
    // Add select clause if provided
    if (select && select.length > 0) {
      body.select = select;
    }
    
    // Add sorting if provided
    if (orderBy && orderBy.length > 0) {
      body.sortBy = orderBy;
    }
    
    // Add pagination
    const limit = parseInt(max_records.toString(), 10);
    body.options = {
      skip,
      top: Math.min(limit, 1000), // API has a limit of 1000 records per request
      ...(options || {})
    };
    
    // Execute the query
    const response = await this.client.request({
      method: 'POST',
      path: '/records/query',
      body
    });
    
    if (!response.success || !response.data) {
      logger.error('Failed to query records', { 
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to query records');
    }
    
    // Safely validate response structure
    if (typeof response.data !== 'object' || response.data === null) {
      throw new Error('Invalid API response: data is not an object');
    }
    
    const data = response.data as Record<string, unknown>;
    
    // Validate records array exists
    if (!Array.isArray(data.data)) {
      logger.error('Query response missing data array', { data });
      throw new Error('Query response does not contain records array');
    }
    
    const records = data.data;
    
    // Validate and type-cast fields array
    const fields = Array.isArray(data.fields) 
      ? data.fields as Record<string, unknown>[]
      : undefined;
    
    const metadata = {
      fields,
      tableId: table_id,
      numRecords: records.length,
      skip
    };
    
    // Handle pagination if enabled and there may be more records
    let allRecords = [...records];
    let hasMore = records.length === body.options.top;
    
    if (paginate && hasMore && allRecords.length < limit) {
      logger.info('Paginating query results', { 
        recordsFetched: allRecords.length,
        limit
      });
      
      let currentSkip = skip + records.length;
      let iterationCount = 0;
      const maxIterations = 100; // Circuit breaker: prevent infinite loops
      const startTime = Date.now();
      const maxTimeMs = 30000; // 30 second timeout
      
      // Continue fetching until we reach the limit or there are no more records
      while (hasMore && allRecords.length < limit) {
        // Circuit breaker checks
        iterationCount++;
        if (iterationCount > maxIterations) {
          logger.error('Pagination circuit breaker: too many iterations', { 
            iterationCount, 
            maxIterations,
            totalRecords: allRecords.length 
          });
          break;
        }
        
        if (Date.now() - startTime > maxTimeMs) {
          logger.error('Pagination circuit breaker: timeout exceeded', { 
            timeElapsed: Date.now() - startTime,
            maxTimeMs,
            totalRecords: allRecords.length 
          });
          break;
        }
        // Update pagination options
        body.options.skip = currentSkip;
        body.options.top = Math.min(limit - allRecords.length, 1000);
        
        // Execute next page query
        const pageResponse = await this.client.request({
          method: 'POST',
          path: '/records/query',
          body
        });
        
        if (!pageResponse.success || !pageResponse.data) {
          logger.error('Failed to query additional records', { 
            error: pageResponse.error,
            tableId: table_id,
            skip: currentSkip
          });
          break;
        }
        
        // Safely validate pagination response structure
        if (typeof pageResponse.data !== 'object' || pageResponse.data === null) {
          logger.error('Invalid pagination response: data is not an object');
          break;
        }
        
        const pageData = pageResponse.data as Record<string, unknown>;
        
        // Validate page records array exists
        if (!Array.isArray(pageData.data)) {
          logger.error('Pagination response missing data array', { pageData });
          break;
        }
        
        const pageRecords = pageData.data;
        
        // Zero progress detection - prevent infinite loops from bad API responses
        if (pageRecords.length === 0) {
          logger.debug('No more records returned, stopping pagination');
          hasMore = false;
          break;
        }
        
        // Add the new records to our results
        allRecords = [...allRecords, ...pageRecords];
        
        // Validate pagination progress to prevent infinite loops
        const previousSkip = currentSkip;
        currentSkip += pageRecords.length;
        
        // Anti-bypass check: ensure offset actually advanced
        if (currentSkip <= previousSkip) {
          logger.error('Pagination offset did not advance - potential infinite loop', {
            previousSkip,
            currentSkip,
            recordsReceived: pageRecords.length
          });
          break;
        }
        
        // Anti-bypass check: ensure we're not receiving the same data
        if (pageRecords.length === body.options.top && 
            allRecords.length + pageRecords.length > limit) {
          logger.debug('Truncating final page to respect limit');
          const remainingSlots = limit - allRecords.length;
          allRecords = [...allRecords, ...pageRecords.slice(0, remainingSlots)];
          hasMore = false;
          break;
        }
        
        hasMore = pageRecords.length === body.options.top && allRecords.length < limit;
        
        logger.debug('Fetched additional records', { 
          newRecords: pageRecords.length,
          totalRecords: allRecords.length,
          limit,
          currentSkip,
          hasMore
        });
      }
      
      // Update metadata for the complete result set
      metadata.numRecords = allRecords.length;
    }
    
    logger.info(`Retrieved ${allRecords.length} records from table`, { 
      tableId: table_id,
      hasMore
    });
    
    return {
      records: allRecords,
      totalRecords: allRecords.length,
      hasMore,
      metadata
    };
  }
}