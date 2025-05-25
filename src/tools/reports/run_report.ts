import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RunReportTool');

interface RunReportParams {
  report_id: string;
  options?: {
    filters?: Record<string, any>;
    format?: 'JSON' | 'CSV' | 'XML';
    groupBy?: string[];
    sortBy?: string[];
    skip?: number;
    top?: number;
  };
}

/**
 * Tool for executing Quickbase reports
 */
export class RunReportTool extends BaseTool<RunReportParams, any> {
  public readonly name = 'run_report';
  public readonly description = 'Execute a Quickbase report with optional filters and parameters';
  public readonly paramSchema = {
    type: 'object',
    properties: {
      report_id: {
        type: 'string',
        description: 'The ID of the report to run'
      },
      options: {
        type: 'object',
        description: 'Additional options for the report execution',
        properties: {
          filters: {
            type: 'object',
            description: 'Filter conditions for the report'
          },
          format: {
            type: 'string',
            description: 'Output format for the report',
            enum: ['JSON', 'CSV', 'XML']
          },
          groupBy: {
            type: 'array',
            description: 'Fields to group results by',
            items: { type: 'string' }
          },
          sortBy: {
            type: 'array',
            description: 'Fields to sort results by',
            items: { type: 'string' }
          },
          skip: {
            type: 'number',
            description: 'Number of records to skip'
          },
          top: {
            type: 'number',
            description: 'Number of records to retrieve'
          }
        }
      }
    },
    required: ['report_id']
  };

  constructor(client: QuickbaseClient) {
    super(client);
  }

  protected async run(params: RunReportParams): Promise<any> {
    const { report_id, options = {} } = params;
    
    logger.info(`Running report: ${report_id}`);

    const response = await this.client.request({
      method: 'POST',
      path: `/reports/${report_id}/run`,
      body: options
    });

    logger.info(`Report executed successfully: ${report_id}`);

    return response;
  }
}