import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetReportTool');

/**
 * Parameters for get_report tool
 */
export interface GetReportParams {
  /**
   * The ID of the table containing the report
   */
  table_id: string;

  /**
   * The ID of the report to retrieve
   */
  report_id: string;
}

/**
 * Response from getting a report
 */
export interface GetReportResult {
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
   * The query used by the report
   */
  query?: Record<string, any>;

  /**
   * Properties of the report
   */
  properties?: Record<string, any>;

  /**
   * Additional report metadata
   */
  [key: string]: any;
}

/**
 * Tool for retrieving details of a Quickbase report
 */
export class GetReportTool extends BaseTool<GetReportParams, GetReportResult> {
  public name = 'get_report';
  public description = 'Gets details of a specific report in a Quickbase table';

  /**
   * Parameter schema for get_report
   */
  public paramSchema = {
    type: 'object',
    properties: {
      table_id: {
        type: 'string',
        description: 'The ID of the table'
      },
      report_id: {
        type: 'string',
        description: 'The ID of the report'
      }
    },
    required: ['table_id', 'report_id']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the get_report tool
   * @param params Tool parameters
   * @returns Report details
   */
  protected async run(params: GetReportParams): Promise<GetReportResult> {
    const { table_id, report_id } = params;

    logger.info('Getting Quickbase report details', {
      tableId: table_id,
      reportId: report_id
    });

    // Get the report
    const response = await this.client.request({
      method: 'GET',
      path: `/reports/${report_id}?tableId=${table_id}`
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get report', {
        error: response.error,
        reportId: report_id
      });
      throw new Error(response.error?.message || 'Failed to get report');
    }

    const report = response.data as GetReportResult;

    logger.info('Successfully retrieved report', {
      reportId: report.id,
      name: report.name
    });

    return report;
  }
}
