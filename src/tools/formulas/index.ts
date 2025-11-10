import { QuickbaseClient } from '../../client/quickbase';
import { toolRegistry } from '../registry';
import { RunFormulaTool } from './run_formula';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FormulaTools');

export function registerFormulaTools(client: QuickbaseClient): void {
  logger.info('Registering formula tools');

  toolRegistry.registerTool(new RunFormulaTool(client));

  logger.info('Formula tools registered');
}

export * from './run_formula';
