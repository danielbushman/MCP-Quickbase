import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { RunReportTool } from "./run_report";
import { createLogger } from "../../utils/logger";

const logger = createLogger("ReportTools");

/**
 * Register all report-related tools
 */
export function registerReportTools(client: QuickbaseClient): void {
  logger.info("Registering report operation tools");

  toolRegistry.registerTool(new RunReportTool(client));

  logger.info("Report operation tools registered");
}

export * from "./run_report";
