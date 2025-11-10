import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetFieldsUsageTool');

/**
 * Parameters for get_fields_usage tool
 */
export interface GetFieldsUsageParams {
  /**
   * ID of the table to analyze field usage for
   */
  table_id: string;

  /**
   * Filter to unused fields only
   */
  unused_only?: boolean;

  /**
   * Minimum usage threshold percentage (0-100)
   */
  min_usage_threshold?: number;
}

/**
 * Individual field usage summary
 */
export interface FieldUsageSummary {
  /**
   * Field ID
   */
  id: string;

  /**
   * Field name
   */
  name: string;

  /**
   * Field type
   */
  type: string;

  /**
   * Number of records with data
   */
  recordsWithData: number;

  /**
   * Usage percentage
   */
  usagePercentage: number;

  /**
   * Whether field is used in formulas
   */
  usedInFormulas: boolean;

  /**
   * Whether field is used in reports
   */
  usedInReports: boolean;
}

/**
 * Result from analyzing all fields usage
 */
export interface GetFieldsUsageResult {
  /**
   * Table ID
   */
  tableId: string;

  /**
   * Total number of fields
   */
  totalFields: number;

  /**
   * Number of unused fields
   */
  unusedFields: number;

  /**
   * Array of field usage summaries
   */
  fields: FieldUsageSummary[];

  /**
   * Recommendations for optimization
   */
  recommendations?: string[];

  /**
   * Additional metadata
   */
  [key: string]: any;
}

/**
 * Tool for analyzing usage of all fields in a Quickbase table
 * Provides comprehensive insights for table optimization and cleanup
 */
export class GetFieldsUsageTool extends BaseTool<GetFieldsUsageParams, GetFieldsUsageResult> {
  public name = 'get_fields_usage';
  public description = 'Analyze usage statistics for all fields in a Quickbase table. Identifies unused fields, low-usage fields, and provides optimization recommendations.';

  /**
   * Parameter schema for get_fields_usage
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'ID of the table to analyze'
      },
      unused_only: {
        type: 'boolean',
        description: 'Filter to show only unused fields (default: false)'
      },
      min_usage_threshold: {
        type: 'number',
        description: 'Minimum usage threshold percentage to filter by (0-100)'
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
   * Run the get_fields_usage tool
   * @param params Tool parameters
   * @returns Fields usage analysis
   */
  protected async run(params: GetFieldsUsageParams): Promise<GetFieldsUsageResult> {
    logger.info('Getting fields usage information', {
      tableId: params.table_id,
      unusedOnly: params.unused_only,
      threshold: params.min_usage_threshold
    });

    const { table_id, unused_only, min_usage_threshold } = params;

    // Build query parameters
    const queryParams: Record<string, string> = {};
    if (unused_only !== undefined) {
      queryParams.unusedOnly = String(unused_only);
    }
    if (min_usage_threshold !== undefined) {
      queryParams.minUsageThreshold = String(min_usage_threshold);
    }

    // Get fields usage statistics
    const response = await this.client.request({
      method: 'GET',
      path: `/fields/usage`,
      params: {
        tableId: table_id,
        ...queryParams
      }
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get fields usage', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to get fields usage information');
    }

    const usage = response.data as Record<string, any>;
    const fields = usage.fields || usage.data || [];

    // Calculate summary statistics
    const unusedFieldsCount = fields.filter(
      (f: any) => f.usagePercentage === 0 || f.recordsWithData === 0
    ).length;

    // Generate recommendations
    const recommendations: string[] = [];
    if (unusedFieldsCount > 0) {
      recommendations.push(
        `Found ${unusedFieldsCount} unused field(s). Consider removing them to improve performance.`
      );
    }

    const lowUsageFields = fields.filter(
      (f: any) => f.usagePercentage > 0 && f.usagePercentage < 10
    ).length;
    if (lowUsageFields > 0) {
      recommendations.push(
        `Found ${lowUsageFields} field(s) with less than 10% usage. Review for potential cleanup.`
      );
    }

    logger.info('Successfully retrieved fields usage', {
      tableId: table_id,
      totalFields: fields.length,
      unusedFields: unusedFieldsCount
    });

    return {
      tableId: table_id,
      totalFields: fields.length,
      unusedFields: unusedFieldsCount,
      fields: fields.map((f: any) => ({
        id: f.id || f.fieldId,
        name: f.name || f.label,
        type: f.type || f.fieldType,
        recordsWithData: f.recordsWithData || 0,
        usagePercentage: f.usagePercentage || 0,
        usedInFormulas: f.usedInFormulas || false,
        usedInReports: f.usedInReports || false
      })),
      recommendations,
      ...usage
    };
  }
}
