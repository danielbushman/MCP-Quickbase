import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("BulkCreateRecordsTool");

/**
 * Parameters for bulk_create_records tool
 */
export interface BulkCreateRecordsParams {
  /**
   * The ID of the table to create records in
   */
  table_id: string;

  /**
   * Array of record data to insert
   */
  records: Record<string, any>[];
}

/**
 * Response from bulk creating records
 */
export interface BulkCreateRecordsResult {
  /**
   * Array of created record IDs
   */
  recordIds: string[];

  /**
   * The ID of the table the records were created in
   */
  tableId: string;

  /**
   * Number of records created
   */
  createdCount: number;

  /**
   * Creation timestamp
   */
  createdTime?: string;
}

/**
 * Tool for creating multiple records in a Quickbase table
 */
export class BulkCreateRecordsTool extends BaseTool<
  BulkCreateRecordsParams,
  BulkCreateRecordsResult
> {
  public name = "bulk_create_records";
  public description = "Creates multiple records in a Quickbase table";

  /**
   * Parameter schema for bulk_create_records
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "The ID of the Quickbase table",
      },
      records: {
        type: "array",
        description: "Array of record data to insert",
        items: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    required: ["table_id", "records"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the bulk_create_records tool
   * @param params Tool parameters
   * @returns Bulk create result
   */
  protected async run(
    params: BulkCreateRecordsParams,
  ): Promise<BulkCreateRecordsResult> {
    const { table_id, records } = params;

    logger.info(`Bulk creating ${records.length} records in Quickbase table`, {
      tableId: table_id,
      recordCount: records.length,
    });

    // Validate records
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new Error("Records array is required and must not be empty");
    }

    // Prepare record data
    const formattedRecords = records.map((record) => {
      const recordData: Record<string, { value: any }> = {};

      for (const [field, value] of Object.entries(record)) {
        recordData[field] = { value };
      }

      return recordData;
    });

    // Prepare request body
    const body: Record<string, any> = {
      to: table_id,
      data: formattedRecords,
    };

    // Create the records
    const response = await this.client.request({
      method: "POST",
      path: "/records",
      body,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to bulk create records", {
        error: response.error,
        tableId: table_id,
      });
      throw new Error(
        response.error?.message || "Failed to bulk create records",
      );
    }

    const result = response.data as Record<string, any>;
    const metadata = result.metadata || {};

    if (!metadata.createdRecordIds || metadata.createdRecordIds.length === 0) {
      logger.error("Bulk record creation response missing record IDs", {
        response: result,
      });
      throw new Error("Records created but no record IDs were returned");
    }

    const recordIds = metadata.createdRecordIds;

    logger.info(`Successfully created ${recordIds.length} records`, {
      recordCount: recordIds.length,
      tableId: table_id,
    });

    return {
      recordIds,
      tableId: table_id,
      createdCount: recordIds.length,
      createdTime: new Date().toISOString(),
    };
  }
}
