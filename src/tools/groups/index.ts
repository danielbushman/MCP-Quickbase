import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { ListGroupsTool } from './list_groups';
import { GetGroupTool } from './get_group';
import { CreateGroupTool } from './create_group';
import { UpdateGroupTool } from './update_group';
import { DeleteGroupTool } from './delete_group';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GroupTools');

export function registerGroupTools(client: QuickbaseClient): void {
  logger.info('Registering SCIM group management tools');
  toolRegistry.registerTool(new ListGroupsTool(client));
  toolRegistry.registerTool(new GetGroupTool(client));
  toolRegistry.registerTool(new CreateGroupTool(client));
  toolRegistry.registerTool(new UpdateGroupTool(client));
  toolRegistry.registerTool(new DeleteGroupTool(client));
  logger.info('SCIM group management tools registered');
}

export * from './list_groups';
export * from './get_group';
export * from './create_group';
export * from './update_group';
export * from './delete_group';
