import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { QueryRecordsTool } from './query_records';
import { CreateRecordTool } from './create_record';
import { UpdateRecordTool } from './update_record';
import { BulkCreateRecordsTool } from './bulk_create_records';
import { BulkUpdateRecordsTool } from './bulk_update_records';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RecordTools');

/**
 * Register all record operation tools with the registry
 * @param client Quickbase client
 */
export function registerRecordTools(client: QuickbaseClient): void {
  logger.info('Registering record operation tools');
  
  // Register individual tools
  toolRegistry.registerTool(new QueryRecordsTool(client));
  toolRegistry.registerTool(new CreateRecordTool(client));
  toolRegistry.registerTool(new UpdateRecordTool(client));
  toolRegistry.registerTool(new BulkCreateRecordsTool(client));
  toolRegistry.registerTool(new BulkUpdateRecordsTool(client));
  
  logger.info('Record operation tools registered');
}

// Export all tools
export * from './query_records';
export * from './create_record';
export * from './update_record';
export * from './bulk_create_records';
export * from './bulk_update_records';