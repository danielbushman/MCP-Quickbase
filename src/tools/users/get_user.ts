import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface GetUserParams {
  user_id: string;
}

export class GetUserTool extends BaseTool<GetUserParams, any> {
  public name = 'get_user';
  public description = 'Get a specific user by ID using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: { user_id: { type: 'string', description: 'User ID' } },
    required: ['user_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: GetUserParams): Promise<any> {
    const response = await this.client.request({
      method: 'GET',
      path: `/scim/v2/Users/${params.user_id}`
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user');
    }
    return response.data;
  }
}
