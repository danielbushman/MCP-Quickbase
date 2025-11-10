import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { GetAuditLogsTool } from './get_audit_logs';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AuditTools');

export function registerAuditTools(client: QuickbaseClient): void {
  logger.info('Registering audit log tools');
  toolRegistry.registerTool(new GetAuditLogsTool(client));
  logger.info('Audit log tools registered');
}

export * from './get_audit_logs';
