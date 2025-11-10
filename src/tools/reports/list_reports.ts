import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListReportsTool');

/**
 * Parameters for list_reports tool
 */
export interface ListReportsParams {
  /**
   * The ID of the table to list reports for
   */
  table_id: string;
}

/**
 * Individual report information
 */
export interface ReportInfo {
  /**
   * The ID of the report
   */
  id: string;

  /**
   * The name of the report
   */
  name: string;

  /**
   * The type of report
   */
  type?: string;

  /**
   * The description of the report
   */
  description?: string;

  /**
   * Additional report metadata
   */
  [key: string]: any;
}

/**
 * Response from listing reports
 */
export interface ListReportsResult {
  /**
   * Array of reports
   */
  reports: ReportInfo[];

  /**
   * The ID of the table
   */
  tableId: string;
}

/**
 * Tool for listing reports in a Quickbase table
 */
export class ListReportsTool extends BaseTool<ListReportsParams, ListReportsResult> {
  public name = 'list_reports';
  public description = 'Lists all reports for a Quickbase table';

  /**
   * Parameter schema for list_reports
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table'
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
   * Run the list_reports tool
   * @param params Tool parameters
   * @returns List of reports
   */
  protected async run(params: ListReportsParams): Promise<ListReportsResult> {
    const { table_id } = params;

    logger.info('Listing reports for Quickbase table', {
      tableId: table_id
    });

    // Get the reports
    const response = await this.client.request({
      method: 'GET',
      path: `/reports?tableId=${table_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to list reports', {
        error: response.error,
        tableId: table_id
      });
      throw new Error(response.error?.message || 'Failed to list reports');
    }

    const result = response.data as Record<string, any>;
    const reports = Array.isArray(result) ? result : (result.reports || []);

    logger.info(`Successfully retrieved ${reports.length} reports`, {
      reportCount: reports.length,
      tableId: table_id
    });

    return {
      reports,
      tableId: table_id
    };
  }
}
