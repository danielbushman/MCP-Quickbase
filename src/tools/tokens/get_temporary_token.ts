import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';

export interface GetTemporaryTokenParams {
  dbid: string;
}

export class GetTemporaryTokenTool extends BaseTool<GetTemporaryTokenParams, any> {
  public name = 'get_temporary_token';
  public description = 'Get a temporary authentication token for a specific database/app';
  public paramSchema = {
    type: 'object',
    properties: { dbid: { type: 'string', description: 'Database/App ID' } },
    required: ['dbid']
  };

  constructor(client: QuickbaseClient) { super(client); }

  protected async run(params: GetTemporaryTokenParams): Promise<any> {
    const response = await this.client.request({
      method: 'GET',
      path: `/auth/temporary/${params.dbid}`
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get temporary token');
    }
    return response.data;
  }
}
