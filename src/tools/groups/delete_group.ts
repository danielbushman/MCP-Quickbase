import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface DeleteGroupParams {
  group_id: string;
}

export class DeleteGroupTool extends BaseTool<DeleteGroupParams, any> {
  public name = 'delete_group';
  public description = 'Delete a group using SCIM 2.0';
  public paramSchema = {
    type: 'object',
    properties: { group_id: { type: 'string' } },
    required: ['group_id']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: DeleteGroupParams): Promise<any> {
    const response = await this.client.request({
      method: 'DELETE',
      path: `/scim/v2/Groups/${params.group_id}`
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete group');
    }
    return { success: true, groupId: params.group_id, message: 'Group deleted' };
  }
}
