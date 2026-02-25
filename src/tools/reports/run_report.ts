import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("RunReportTool");

export interface RunReportParams {
  report_id: string;
  options?: {
    filters?: Record<string, any>;
    format?: "JSON" | "CSV" | "XML";
    groupBy?: string[];
    sortBy?: string[];
    skip?: number;
    top?: number;
  };
}

export interface RunReportResult {
  fields?: Record<string, unknown>[];
  data: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

/**
 * Tool for executing Quickbase reports
 */
export class RunReportTool extends BaseTool<RunReportParams, RunReportResult> {
  public name = "run_report";
  public description =
    "Execute a Quickbase report with optional filters and parameters";
  public paramSchema = {
    type: "object",
    properties: {
      report_id: {
        type: "string",
        description: "The ID of the report to run",
      },
      options: {
        type: "object",
        description: "Additional options for the report execution",
        properties: {
          filters: {
            type: "object",
            description: "Filter conditions for the report",
          },
          format: {
            type: "string",
            description: "Output format for the report",
            enum: ["JSON", "CSV", "XML"],
          },
          groupBy: {
            type: "array",
            description: "Fields to group results by",
            items: { type: "string" },
          },
          sortBy: {
            type: "array",
            description: "Fields to sort results by",
            items: { type: "string" },
          },
          skip: {
            type: "number",
            description: "Number of records to skip",
          },
          top: {
            type: "number",
            description: "Number of records to retrieve",
          },
        },
      },
    },
    required: ["report_id"],
  };

  constructor(client: QuickbaseClient) {
    super(client);
  }

  protected async run(params: RunReportParams): Promise<RunReportResult> {
    const { report_id, options = {} } = params;

    logger.info(`Running report: ${report_id}`);

    const response = await this.client.request({
      method: "POST",
      path: `/reports/${report_id}/run`,
      body: options,
    });

    if (!response.success) {
      logger.error(`Failed to run report: ${report_id}`, {
        error: response.error,
      });
      throw new Error(response.error?.message || "Failed to run report");
    }

    logger.info(`Report executed successfully: ${report_id}`);

    return response.data as RunReportResult;
  }
}
