import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface ListGroupsParams {
  startIndex?: number;
  count?: number;
  filter?: string;
}

export class ListGroupsTool extends BaseTool<ListGroupsParams, any> {
  public name = 'list_groups';
  public description = 'List groups using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: {
      startIndex: { type: 'number' },
      count: { type: 'number' },
      filter: { type: 'string' }
    }
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: ListGroupsParams): Promise<any> {
    const queryParams: Record<string, string> = {};
    if (params.startIndex) queryParams.startIndex = String(params.startIndex);
    if (params.count) queryParams.count = String(params.count);
    if (params.filter) queryParams.filter = params.filter;

    const response = await this.client.request({
      method: 'GET',
      path: '/scim/v2/Groups',
      params: queryParams
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to list groups');
    }
    return response.data;
  }
}
