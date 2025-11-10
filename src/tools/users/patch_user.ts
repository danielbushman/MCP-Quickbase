import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface PatchUserParams {
  user_id: string;
  operations: Array<{ op: string; path?: string; value: any; }>;
}

export class PatchUserTool extends BaseTool<PatchUserParams, any> {
  public name = 'patch_user';
  public description = 'Patch a user using SCIM 2.0 PATCH operations';
  public paramSchema = {
    type: 'object',
    properties: {
      user_id: { type: 'string' },
      operations: { type: 'array' }
    },
    required: ['user_id', 'operations']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: PatchUserParams): Promise<any> {
    const response = await this.client.request({
      method: 'PATCH',
      path: `/scim/v2/Users/${params.user_id}`,
      body: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: params.operations
      }
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to patch user');
    }
    return response.data;
  }
}
