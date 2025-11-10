import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { ListUsersTool } from './list_users';
import { GetUserTool } from './get_user';
import { CreateUserTool } from './create_user';
import { UpdateUserTool } from './update_user';
import { PatchUserTool } from './patch_user';
import { DeleteUserTool } from './delete_user';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UserTools');

export function registerUserTools(client: QuickbaseClient): void {
  logger.info('Registering SCIM user management tools');
  toolRegistry.registerTool(new ListUsersTool(client));
  toolRegistry.registerTool(new GetUserTool(client));
  toolRegistry.registerTool(new CreateUserTool(client));
  toolRegistry.registerTool(new UpdateUserTool(client));
  toolRegistry.registerTool(new PatchUserTool(client));
  toolRegistry.registerTool(new DeleteUserTool(client));
  logger.info('SCIM user management tools registered');
}

export * from './list_users';
export * from './get_user';
export * from './create_user';
export * from './update_user';
export * from './patch_user';
export * from './delete_user';
