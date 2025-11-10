import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { CloneUserTokenTool } from './clone_user_token';
import { DeactivateUserTokenTool } from './deactivate_user_token';
import { DeleteUserTokenTool } from './delete_user_token';
import { GetTemporaryTokenTool } from './get_temporary_token';
import { createLogger } from '../../utils/logger';

const logger = createLogger('TokenTools');

export function registerTokenTools(client: QuickbaseClient): void {
  logger.info('Registering user token management tools');
  toolRegistry.registerTool(new CloneUserTokenTool(client));
  toolRegistry.registerTool(new DeactivateUserTokenTool(client));
  toolRegistry.registerTool(new DeleteUserTokenTool(client));
  toolRegistry.registerTool(new GetTemporaryTokenTool(client));
  logger.info('User token management tools registered');
}

export * from './clone_user_token';
export * from './deactivate_user_token';
export * from './delete_user_token';
export * from './get_temporary_token';
