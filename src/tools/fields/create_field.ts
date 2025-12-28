import { BaseTool } from "../base";
import { QuickbaseClient } from "../../client/quickbase";
import { createLogger } from "../../utils/logger";

const logger = createLogger("CreateFieldTool");

/**
 * Field property definitions for various field types
 */
export interface FieldProperties {
  // Text field properties
  maxLength?: number;

  // Default value for any field type
  defaultValue?: string | number;

  // Numeric field properties
  precision?: number;

  // Date field properties
  format?: string;

  // Multiple choice properties
  choices?: {
    label: string;
    value: string;
  }[];

  // Lookup field properties
  targetTableId?: string;
  targetFieldId?: string;

  // Common properties
  appearsByDefault?: boolean;
  findEnabled?: boolean;

  // Allow any other properties
  [key: string]: any;
}

/**
 * Parameters for create_field tool
 */
export interface CreateFieldParams {
  /**
   * ID of the table to create the field in
   */
  table_id: string;

  /**
   * Display label for the field
   */
  field_name: string;

  /**
   * Type of the field: text, text-multi-line, rich-text, numeric, currency,
   * percent, rating, date, datetime, checkbox, user, email, url, phone, address, file
   */
  field_type: string;

  /**
   * Help text shown to users when editing the field (stored as fieldHelp)
   */
  description?: string;

  /**
   * Additional options and properties for the field
   */
  options?: FieldProperties;
}

/**
 * Response from creating a field
 */
export interface CreateFieldResult {
  /**
   * The ID of the created field
   */
  fieldId: string;

  /**
   * The label/name of the created field
   */
  label: string;

  /**
   * The type of the created field
   */
  fieldType: string;

  /**
   * Help text for the field (shown to users when editing)
   */
  fieldHelp?: string;

  /**
   * The ID of the table the field was created in
   */
  tableId: string;

  /**
   * Additional details about the created field
   */
  [key: string]: any;
}

/**
 * Tool for creating a new field in a Quickbase table
 */
export class CreateFieldTool extends BaseTool<
  CreateFieldParams,
  CreateFieldResult
> {
  public name = "create_field";
  public description =
    "Creates a new field in a Quickbase table. " +
    "Valid field_type values: text, text-multi-line, text-multiple-choice, rich-text, " +
    "numeric, currency, percent, rating, date, datetime, timestamp, timeofday, duration, " +
    "checkbox, user, multiuser, email, url, phone, address, file. " +
    "Use options to set field properties like maxLength, defaultValue, numLines, etc.";

  /**
   * Parameter schema for create_field
   */
  public paramSchema = {
    type: "object",
    properties: {
      table_id: {
        type: "string",
        description: "The ID of the table (e.g., 'bqx7xkw3r')",
      },
      field_name: {
        type: "string",
        description: "Display label for the field",
      },
      field_type: {
        type: "string",
        description:
          "Field type: text, text-multi-line, rich-text, numeric, currency, " +
          "percent, rating, date, datetime, checkbox, user, email, url, phone, address, file",
      },
      description: {
        type: "string",
        description:
          "Help text shown to users when editing the field (stored as fieldHelp)",
      },
      options: {
        type: "object",
        description:
          "Field properties: appearsByDefault, findEnabled, required, unique, " +
          "maxLength (text), numLines (multi-line), defaultValue, etc.",
      },
    },
    required: ["table_id", "field_name", "field_type"],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the create_field tool
   * @param params Tool parameters
   * @returns Created field details
   */
  protected async run(params: CreateFieldParams): Promise<CreateFieldResult> {
    const { table_id, field_name, field_type, description, options } = params;

    logger.info("Creating new field in Quickbase table", {
      tableId: table_id,
      fieldName: field_name,
      fieldType: field_type,
    });

    // Prepare request body
    // Note: Quickbase API uses 'fieldHelp' at root level for help text (not 'description')
    const body: Record<string, any> = {
      label: field_name,
      fieldType: field_type,
    };

    // Add fieldHelp if description provided (maps to root-level fieldHelp)
    if (description) {
      body.fieldHelp = description;
    }

    // Add properties if provided
    if (options && Object.keys(options).length > 0) {
      body.properties = { ...options };
    }

    // Create the field
    const response = await this.client.request({
      method: "POST",
      path: `/fields?tableId=${table_id}`,
      body,
    });

    if (!response.success || !response.data) {
      logger.error("Failed to create field", {
        error: response.error,
        tableId: table_id,
        fieldName: field_name,
      });
      throw new Error(response.error?.message || "Failed to create field");
    }

    const field = response.data as Record<string, any>;

    logger.info("Successfully created field", {
      fieldId: field.id,
      tableId: table_id,
      fieldName: field.label,
    });

    return {
      fieldId: field.id,
      label: field.label,
      fieldType: field.fieldType,
      fieldHelp: field.fieldHelp,
      tableId: table_id,
      ...field,
    };
  }
}
