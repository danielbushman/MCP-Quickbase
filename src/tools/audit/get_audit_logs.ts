import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GetAuditLogsTool');

export interface GetAuditLogsParams {
  fromDate?: string;
  toDate?: string;
  userId?: string;
  actions?: string[];
  limit?: number;
}

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  details?: any;
}

export interface GetAuditLogsResult {
  logs: AuditLogEntry[];
  total: number;
  fromDate?: string;
  toDate?: string;
}

export class GetAuditLogsTool extends BaseTool<GetAuditLogsParams, GetAuditLogsResult> {
  public name = 'get_audit_logs';
  public description = 'Retrieve audit logs for account activity, user actions, and security events. Supports filtering by date range, user, and action type.';

  public paramSchema = {
    type: 'object',
    properties: {
      fromDate: { type: 'string', description: 'Start date (ISO 8601 format)' },
      toDate: { type: 'string', description: 'End date (ISO 8601 format)' },
      userId: { type: 'string', description: 'Filter by user ID' },
      actions: { type: 'array', items: { type: 'string' }, description: 'Filter by action types' },
      limit: { type: 'number', description: 'Maximum number of logs to return' }
    }
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: GetAuditLogsParams): Promise<GetAuditLogsResult> {
    logger.info('Getting audit logs', params);

    const queryParams: Record<string, string> = {};
    if (params.fromDate) queryParams.fromDate = params.fromDate;
    if (params.toDate) queryParams.toDate = params.toDate;
    if (params.userId) queryParams.userId = params.userId;
    if (params.actions) queryParams.actions = params.actions.join(',');
    if (params.limit) queryParams.limit = String(params.limit);

    const response = await this.client.request({
      method: 'GET',
      path: '/audit',
      params: queryParams
    });

    if (!response.success || !response.data) {
      logger.error('Failed to get audit logs', { error: response.error });
      throw new Error(response.error?.message || 'Failed to get audit logs');
    }

    const data = response.data as any;
    const logs = data.logs || data.data || data.auditLogs || [];

    logger.info('Successfully retrieved audit logs', { count: logs.length });

    return {
      logs: logs.map((log: any) => ({
        timestamp: log.timestamp || log.date,
        userId: log.userId || log.user,
        userName: log.userName || log.username,
        action: log.action || log.actionType,
        resource: log.resource || log.resourceId,
        details: log.details || log.metadata
      })),
      total: logs.length,
      fromDate: params.fromDate,
      toDate: params.toDate,
      ...data
    };
  }
}
