import { BaseTool } from "./base";
import { QuickbaseClient } from "../client/quickbase";
import { createLogger } from "../utils/logger";

const logger = createLogger("TestConnectionTool");

/**
 * Test connection parameters
 */
export interface TestConnectionParams {
  // No parameters needed for test_connection
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  connected: boolean;
  userInfo?: {
    id: string;
    email: string;
    name: string;
    [key: string]: unknown;
  };
  realmInfo?: {
    hostname: string;
    id: string;
    [key: string]: unknown;
  };
  errorMessage?: string;
}

/**
 * Tool for testing the connection to Quickbase
 */
export class TestConnectionTool extends BaseTool<
  TestConnectionParams,
  TestConnectionResult
> {
  public name = "test_connection";
  public description = "Tests the connection to Quickbase";

  /**
   * Parameter schema for test_connection
   */
  public paramSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the test_connection tool
   * @param params Tool parameters (none required)
   * @returns Test result
   */
  protected async run(
    _params: TestConnectionParams,
  ): Promise<TestConnectionResult> {
    logger.info("Testing connection to Quickbase");

    try {
      // Try to get apps list as a simple test
      // This endpoint requires authentication and will validate our credentials
      const config = this.client.getConfig();

      // If we have an app ID, try to get that specific app
      // Otherwise, just try to list apps (which should return at least one)
      let response;
      if (config.appId) {
        response = await this.client.request({
          method: "GET",
          path: `/apps/${config.appId}`,
        });
      } else {
        response = await this.client.request({
          method: "GET",
          path: "/apps",
        });
      }

      if (!response.success) {
        logger.error("Connection test failed", { error: response.error });
        throw new Error(
          response.error?.message || "Failed to connect to Quickbase",
        );
      }

      logger.info("Connection test successful");

      // Extract some basic info from the response
      const data = response.data as Record<string, unknown>;

      return {
        connected: true,
        userInfo: {
          id: "authenticated",
          email: "authenticated-user",
          name: "Quickbase User",
        },
        realmInfo: {
          hostname: config.realmHost,
          id: config.appId || "no-app-specified",
          appName: (data?.name as string) || "Unknown App",
        },
      };
    } catch (error) {
      logger.error("Connection test failed with error", { error });

      // Provide more specific error messages
      let errorMessage = "Failed to connect to Quickbase";
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Authentication failed. Please check your user token.";
        } else if (error.message.includes("404")) {
          errorMessage = "App not found. Please check your app ID.";
        } else if (error.message.includes("403")) {
          errorMessage = "Access denied. Please check your permissions.";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        connected: false,
        errorMessage,
      };
    }
  }
}
