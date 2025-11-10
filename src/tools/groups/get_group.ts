import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface GetGroupParams {
  group_id: string;
}

export class GetGroupTool extends BaseTool<GetGroupParams, any> {
  public name = 'get_group';
  public description = 'Get a specific group by ID using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: { group_id: { type: 'string' } },
    required: ['group_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: GetGroupParams): Promise<any> {
    const response = await this.client.request({
      method: 'GET',
      path: `/scim/v2/Groups/${params.group_id}`
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get group');
    }
    return response.data;
  }
}
