import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface UpdateGroupParams {
  group_id: string;
  displayName?: string;
  members?: Array<{ value: string; }>;
}

export class UpdateGroupTool extends BaseTool<UpdateGroupParams, any> {
  public name = 'update_group';
  public description = 'Update a group using SCIM 2.0 PUT';
  public paramSchema = {
    type: 'object',
    properties: {
      group_id: { type: 'string' },
      displayName: { type: 'string' },
      members: { type: 'array' }
    },
    required: ['group_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: UpdateGroupParams): Promise<any> {
    const body: any = { schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'] };
    if (params.displayName) body.displayName = params.displayName;
    if (params.members) body.members = params.members;

    const response = await this.client.request({
      method: 'PUT',
      path: `/scim/v2/Groups/${params.group_id}`,
      body
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update group');
    }
    return response.data;
  }
}
