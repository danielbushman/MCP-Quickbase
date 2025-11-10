import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { ListReportsTool } from './list_reports';
import { GetReportTool } from './get_report';
import { RunReportTool } from './run_report';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ReportTools');

/**
 * Register all report-related tools
 */
export function registerReportTools(client: QuickbaseClient): void {
  logger.info('Registering report operation tools');

  toolRegistry.registerTool(new ListReportsTool(client));
  toolRegistry.registerTool(new GetReportTool(client));
  toolRegistry.registerTool(new RunReportTool(client));

  logger.info('Report operation tools registered');
}

export * from './list_reports';
export * from './get_report';
export * from './run_report';