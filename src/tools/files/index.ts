import { QuickbaseClient } from "../../client/quickbase";
import { toolRegistry } from "../registry";
import { UploadFileTool } from "./upload_file";
import { DownloadFileTool } from "./download_file";
import { createLogger } from "../../utils/logger";

const logger = createLogger("FileTools");

/**
 * Register all file operation tools with the registry
 * @param client Quickbase client
 */
export function registerFileTools(client: QuickbaseClient): void {
  logger.info("Registering file operation tools");

  // Register individual tools
  toolRegistry.registerTool(new UploadFileTool(client));
  toolRegistry.registerTool(new DownloadFileTool(client));

  logger.info("File operation tools registered");
}

// Export all tools
export * from "./upload_file";
export * from "./download_file";
