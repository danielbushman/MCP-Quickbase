import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface CreateUserParams {
  userName: string;
  givenName: string;
  familyName: string;
  email: string;
  active?: boolean;
}

export class CreateUserTool extends BaseTool<CreateUserParams, any> {
  public name = 'create_user';
  public description = 'Create a new user using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: {
      userName: { type: 'string' },
      givenName: { type: 'string' },
      familyName: { type: 'string' },
      email: { type: 'string' },
      active: { type: 'boolean' }
    },
    required: ['userName', 'givenName', 'familyName', 'email']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: CreateUserParams): Promise<any> {
    const body = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: params.userName,
      name: { givenName: params.givenName, familyName: params.familyName },
      emails: [{ value: params.email, primary: true }],
      active: params.active !== false
    };
    const response = await this.client.request({
      method: 'POST',
      path: '/scim/v2/Users',
      body
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user');
    }
    return response.data;
  }
}
