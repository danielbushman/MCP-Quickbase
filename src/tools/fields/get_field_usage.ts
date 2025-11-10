import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetFieldUsageTool');

/**
 * Parameters for get_field_usage tool
 */
export interface GetFieldUsageParams {
  /**
   * ID of the field to analyze usage for
   */
  field_id: string;

  /**
   * ID of the table containing the field
   */
  table_id: string;
}

/**
 * Field usage information
 */
export interface FieldUsageInfo {
  /**
   * Field ID
   */
  fieldId: string;

  /**
   * Number of records using this field
   */
  recordsWithData: number;

  /**
   * Number of empty/null records
   */
  recordsEmpty: number;

  /**
   * Total records in table
   */
  totalRecords: number;

  /**
   * Percentage of records with data
   */
  usagePercentage: number;

  /**
   * List of formulas or reports using this field
   */
  usedInFormulas?: string[];

  /**
   * List of reports using this field
   */
  usedInReports?: string[];

  /**
   * Additional usage metadata
   */
  [key: string]: any;
}

/**
 * Tool for analyzing single field usage in a Quickbase table
 * Provides insights for field optimization and cleanup
 */
export class GetFieldUsageTool extends BaseTool<GetFieldUsageParams, FieldUsageInfo> {
  public name = 'get_field_usage';
  public description = 'Analyze usage statistics for a specific field in a Quickbase table. Shows how many records use the field, formulas/reports that reference it, and optimization insights.';

  /**
   * Parameter schema for get_field_usage
   */
  public paramSchema = {
    type: 'object',
    properties: {
      field_id: {
        type: 'string',
        description: 'ID of the field to analyze'
      },
      table_id: {
        type: 'string',
        description: 'ID of the table containing the field'
      }
    },
    required: ['field_id', 'table_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the get_field_usage tool
   * @param params Tool parameters
   * @returns Field usage information
   */
  protected async run(params: GetFieldUsageParams): Promise<FieldUsageInfo> {
    logger.info('Getting field usage information', {
      fieldId: params.field_id,
      tableId: params.table_id
    });

    const { field_id, table_id } = params;

    // Get field usage statistics
    const response = await this.client.request({
      method: 'GET',
      path: `/fields/${field_id}/usage`,
      params: {
        tableId: table_id
      }
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get field usage', {
        error: response.error,
        fieldId: field_id,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to get field usage information');
    }

    const usage = response.data as Record<string, any>;

    logger.info('Successfully retrieved field usage', {
      fieldId: field_id,
      recordsWithData: usage.recordsWithData || 0,
      usagePercentage: usage.usagePercentage || 0
    });

    return {
      fieldId: field_id,
      recordsWithData: usage.recordsWithData || 0,
      recordsEmpty: usage.recordsEmpty || 0,
      totalRecords: usage.totalRecords || 0,
      usagePercentage: usage.usagePercentage || 0,
      usedInFormulas: usage.usedInFormulas || usage.formulas || [],
      usedInReports: usage.usedInReports || usage.reports || [],
      ...usage
    };
  }
}
