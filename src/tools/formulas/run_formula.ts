import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RunFormulaTool');

/**
 * Parameters for run_formula tool
 */
export interface RunFormulaParams {
  /**
   * The Quickbase formula to execute
   */
  formula: string;

  /**
   * Record ID context for the formula (optional)
   */
  rid?: number;

  /**
   * Table ID where the formula should run (optional but recommended)
   */
  table_id?: string;
}

/**
 * Response from running a formula
 */
export interface RunFormulaResult {
  /**
   * The calculated result of the formula
   */
  result: any;

  /**
   * The type of the result (text, numeric, date, etc.)
   */
  resultType?: string;

  /**
   * Any additional metadata about the formula execution
   */
  [key: string]: any;
}

/**
 * Tool for executing Quickbase formulas without storing them
 * Useful for testing formula logic and performing ad-hoc calculations
 */
export class RunFormulaTool extends BaseTool<RunFormulaParams, RunFormulaResult> {
  public name = 'run_formula';
  public description = 'Execute a Quickbase formula calculation without storing it. Useful for testing formula logic and performing ad-hoc calculations.';

  /**
   * Parameter schema for run_formula
   */
  public paramSchema = {
    type: 'object',
    properties: {
      formula: {
        type: 'string',
        description: 'The Quickbase formula to execute (e.g., "[Field1] + [Field2]")'
      },
      rid: {
        type: 'number',
        description: 'Record ID context for the formula evaluation (optional)'
      },
      table_id: {
        type: 'string',
        description: 'Table ID where the formula should run (optional but recommended)'
      }
    },
    required: ['formula']
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the formula execution
   * @param params Tool parameters
   * @returns Formula calculation result
   */
  protected async run(params: RunFormulaParams): Promise<RunFormulaResult> {
    logger.info('Running Quickbase formula', {
      formulaLength: params.formula.length,
      hasRid: !!params.rid,
      hasTableId: !!params.table_id
    });

    const { formula, rid, table_id } = params;

    // Prepare request body
    const body: Record<string, any> = {
      formula
    };

    if (rid !== undefined) {
      body.rid = rid;
    }

    // Execute the formula
    const response = await this.client.request({
      method: 'POST',
      path: '/formulas/run',
      body,
      ...(table_id && { tableId: table_id })
    });

    if (!response.success || !response.data) {
      logger.error('Failed to run formula', {
        error: response.error,
        params
      });
      throw new Error(response.error?.message || 'Failed to execute formula');
    }

    const result = response.data as Record<string, any>;

    logger.info('Successfully executed formula', {
      resultType: typeof result.result
    });

    return {
      result: result.result !== undefined ? result.result : result,
      resultType: result.resultType || typeof result.result,
      ...result
    };
  }
}
