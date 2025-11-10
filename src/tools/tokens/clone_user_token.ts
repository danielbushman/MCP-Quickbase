import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface CloneUserTokenParams {
  token_id: string;
  name?: string;
  description?: string;
}

export class CloneUserTokenTool extends BaseTool<CloneUserTokenParams, any> {
  public name = 'clone_user_token';
  public description = 'Clone an existing user token to create a duplicate with the same permissions';
  public paramSchema = {
    type: 'object',
    properties: {
      token_id: { type: 'string', description: 'Token ID to clone' },
      name: { type: 'string', description: 'Name for the cloned token' },
      description: { type: 'string', description: 'Description for the cloned token' }
    },
    required: ['token_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: CloneUserTokenParams): Promise<any> {
    const body: any = {};
    if (params.name) body.name = params.name;
    if (params.description) body.description = params.description;

    const response = await this.client.request({
      method: 'POST',
      path: `/userTokens/${params.token_id}/clone`,
      body
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to clone user token');
    }
    return response.data;
  }
}
