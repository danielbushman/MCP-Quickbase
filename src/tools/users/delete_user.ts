import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface DeleteUserParams {
  user_id: string;
}

export class DeleteUserTool extends BaseTool<DeleteUserParams, any> {
  public name = 'delete_user';
  public description = 'Delete a user using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: { user_id: { type: 'string' } },
    required: ['user_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: DeleteUserParams): Promise<any> {
    const response = await this.client.request({
      method: 'DELETE',
      path: `/scim/v2/Users/${params.user_id}`
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user');
    }
    return { success: true, userId: params.user_id, message: 'User deleted' };
  }
}
