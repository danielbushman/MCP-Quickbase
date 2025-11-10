import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface DeactivateUserTokenParams {
  token_id: string;
}

export class DeactivateUserTokenTool extends BaseTool<DeactivateUserTokenParams, any> {
  public name = 'deactivate_user_token';
  public description = 'Deactivate a user token to prevent its use without deleting it';
  public paramSchema = {
    type: 'object',
    properties: { token_id: { type: 'string', description: 'Token ID to deactivate' } },
    required: ['token_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: DeactivateUserTokenParams): Promise<any> {
    const response = await this.client.request({
      method: 'POST',
      path: `/userTokens/${params.token_id}/deactivate`,
      body: {}
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to deactivate user token');
    }
    return {
      success: true,
      tokenId: params.token_id,
      message: 'Token deactivated',
      ...(response.data || {})
    };
  }
}
