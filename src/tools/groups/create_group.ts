import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface CreateGroupParams {
  displayName: string;
  members?: Array<{ value: string; }>;
}

export class CreateGroupTool extends BaseTool<CreateGroupParams, any> {
  public name = 'create_group';
  public description = 'Create a new group using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: {
      displayName: { type: 'string' },
      members: { type: 'array' }
    },
    required: ['displayName']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: CreateGroupParams): Promise<any> {
    const body: any = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      displayName: params.displayName
    };
    if (params.members) body.members = params.members;

    const response = await this.client.request({
      method: 'POST',
      path: '/scim/v2/Groups',
      body
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create group');
    }
    return response.data;
  }
}
