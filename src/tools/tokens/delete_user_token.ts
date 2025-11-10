import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface DeleteUserTokenParams {
  token_id: string;
}

export class DeleteUserTokenTool extends BaseTool<DeleteUserTokenParams, any> {
  public name = 'delete_user_token';
  public description = 'Permanently delete a user token';
  public paramSchema = {
    type: 'object',
    properties: { token_id: { type: 'string', description: 'Token ID to delete' } },
    required: ['token_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: DeleteUserTokenParams): Promise<any> {
    const response = await this.client.request({
      method: 'DELETE',
      path: `/userTokens/${params.token_id}`
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user token');
    }
    return { success: true, tokenId: params.token_id, message: 'Token deleted' };
  }
}
