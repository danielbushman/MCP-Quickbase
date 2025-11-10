import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface UpdateUserParams {
  user_id: string;
  userName?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  active?: boolean;
}

export class UpdateUserTool extends BaseTool<UpdateUserParams, any> {
  public name = 'update_user';
  public description = 'Update a user using SCIM 2.0 PUT';
  public paramSchema = {
    type: 'object',
    properties: {
      user_id: { type: 'string' },
      userName: { type: 'string' },
      givenName: { type: 'string' },
      familyName: { type: 'string' },
      email: { type: 'string' },
      active: { type: 'boolean' }
    },
    required: ['user_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: UpdateUserParams): Promise<any> {
    const body: any = { schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'] };
    if (params.userName) body.userName = params.userName;
    if (params.givenName || params.familyName) {
      body.name = {};
      if (params.givenName) body.name.givenName = params.givenName;
      if (params.familyName) body.name.familyName = params.familyName;
    }
    if (params.email) body.emails = [{ value: params.email, primary: true }];
    if (params.active !== undefined) body.active = params.active;

    const response = await this.client.request({
      method: 'PUT',
      path: `/scim/v2/Users/${params.user_id}`,
      body
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user');
    }
    return response.data;
  }
}
