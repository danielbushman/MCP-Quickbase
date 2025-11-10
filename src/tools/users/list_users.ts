import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListUsersTool');

export interface ListUsersParams {
  startIndex?: number;
  count?: number;
  filter?: string;
}

export interface User {
  id: string;
  userName: string;
  name: { givenName?: string; familyName?: string; };
  emails: Array<{ value: string; primary?: boolean; }>;
  active: boolean;
}

export interface ListUsersResult {
  users: User[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}

export class ListUsersTool extends BaseTool<ListUsersParams, ListUsersResult> {
  public name = 'list_users';
  public description = 'List users using SCIM 2.0 protocol. Supports pagination and filtering.';

  public paramSchema = {
    type: 'object',
    properties: {
      startIndex: { type: 'number', description: 'Start index for pagination (default: 1)' },
      count: { type: 'number', description: 'Number of users per page (default: 100)' },
      filter: { type: 'string', description: 'SCIM filter expression' }
    }
  };

  constructor(client: QuickbaseClient) {
    super(client);
  }

  protected async run(params: ListUsersParams): Promise<ListUsersResult> {
    logger.info('Listing users', params);

    const queryParams: Record<string, string> = {};
    if (params.startIndex) queryParams.startIndex = String(params.startIndex);
    if (params.count) queryParams.count = String(params.count);
    if (params.filter) queryParams.filter = params.filter;

    const response = await this.client.request({
      method: 'GET',
      path: '/scim/v2/Users',
      params: queryParams
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to list users');
    }

    const data = response.data as any;
    return {
      users: data.Resources || data.users || [],
      totalResults: data.totalResults || 0,
      startIndex: data.startIndex || 1,
      itemsPerPage: data.itemsPerPage || 0
    };
  }
}
