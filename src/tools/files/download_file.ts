import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";
import { ensureDirectoryExists, writeFile } from "../../utils/file";
import * as path from "path";

const logger = createLogger("DownloadFileTool");

/**
 * Parameters for download_file tool
 */
export interface DownloadFileParams {
  /**
   * The ID of the table containing the record
   */
  table_id: string;

  /**
   * The ID of the record containing the file
   */
  record_id: string;

  /**
   * The ID of the file attachment field
   */
  field_id: string;

  /**
   * Path where the file should be saved
   */
  output_path: string;

  /**
   * The version of the file to download (default 0 for latest)
   */
  version?: string;
}

/**
 * Response from downloading a file
 */
export interface DownloadFileResult {
  /**
   * The ID of the record the file was downloaded from
   */
  recordId: string;

  /**
   * The ID of the field the file was downloaded from
   */
  fieldId: string;

  /**
   * The ID of the table containing the record
   */
  tableId: string;

  /**
   * The name of the downloaded file
   */
  fileName: string;

  /**
   * The size of the downloaded file in bytes
   */
  fileSize: number;

  /**
   * The version of the file
   */
  version: string;

  /**
   * The path where the file was saved
   */
  outputPath: string;

  /**
   * Download timestamp
   */
  downloadTime: string;
}

/**
 * Tool for downloading a file from a field in a Quickbase record
 */
export class DownloadFileTool extends BaseTool<
  DownloadFileParams,
  DownloadFileResult
> {
  public name = "download_file";
  public description = "Downloads a file from a field in a Quickbase record";

  /**
   * Parameter schema for download_file
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "The ID of the Quickbase table",
      },
      record_id: {
        type: "string",
        description: "The ID of the record",
      },
      field_id: {
        type: "string",
        description: "The ID of the field (must be a file attachment field)",
      },
      output_path: {
        type: "string",
        description: "Path where the file should be saved",
      },
      version: {
        type: "string",
        description:
          "The version of the file to download (default 0 for latest)",
      },
    },
    required: ["table_id", "record_id", "field_id", "output_path"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the download_file tool
   * @param params Tool parameters
   * @returns Download result
   */
  protected async run(params: DownloadFileParams): Promise<DownloadFileResult> {
    const {
      table_id,
      record_id,
      field_id,
      output_path,
      version = "0",
    } = params;

    logger.info("Downloading file from Quickbase record", {
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      version,
    });

    // Check if the output directory exists
    const outputDir = path.dirname(output_path);
    if (!ensureDirectoryExists(outputDir)) {
      throw new Error(`Unable to create output directory: ${outputDir}`);
    }

    // Build the URL for downloading the file
    const queryParams = {
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      version,
    };

    // Construct the query string
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    // Download the file
    const response = await this.client.request({
      method: "GET",
      path: `/files?${queryString}`,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to download file", {
        error: response.error,
        tableId: table_id,
        recordId: record_id,
        fieldId: field_id,
      });
      throw new Error(response.error?.message || "Failed to download file");
    }

    const fileData = response.data as Record<string, any>;

    // Extract file information
    const fileName = fileData.fileName || "downloaded_file";
    const fileContent = fileData.fileData;

    if (!fileContent) {
      throw new Error("Downloaded file does not contain any data");
    }

    // Determine if the file content is base64 encoded
    const isBase64 =
      typeof fileContent === "string" &&
      /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(
        fileContent,
      );

    // Decode and write the file
    let fileBuffer: Buffer;

    if (isBase64) {
      fileBuffer = Buffer.from(fileContent, "base64");
    } else if (typeof fileContent === "string") {
      fileBuffer = Buffer.from(fileContent);
    } else {
      throw new Error("Unsupported file data format");
    }

    // Write the file to the output path
    const writeSuccess = writeFile(output_path, fileBuffer);

    if (!writeSuccess) {
      throw new Error(`Failed to write file to ${output_path}`);
    }

    logger.info("Successfully downloaded file", {
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      fileName,
      outputPath: output_path,
    });

    return {
      recordId: record_id,
      fieldId: field_id,
      tableId: table_id,
      fileName,
      fileSize: fileBuffer.length,
      version,
      outputPath: output_path,
      downloadTime: new Date().toISOString(),
    };
  }
}
