#!/usr/bin/env node

/**
 * MCP Stdio Server for Claude CLI integration
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createLogger } from "./utils/logger";
import { QuickbaseClient } from "./client/quickbase";
import { QuickbaseConfig } from "./types/config";
import { CacheService } from "./utils/cache";
import { initializeTools, toolRegistry } from "./tools";
import { createMcpZodSchema } from "./utils/validation";

// Load environment variables
dotenv.config();

const logger = createLogger("mcp-stdio-server");

/**
 * Main server function
 */
async function main(): Promise<void> {
  try {
    // Initialize the MCP server
    const server = new McpServer({
      name: "Quickbase MCP Server",
      version: "2.0.0",
    });

    logger.info("MCP Server created");

    // Check if environment variables are configured
    const hasConfig =
      process.env.QUICKBASE_REALM_HOST && process.env.QUICKBASE_USER_TOKEN;

    if (!hasConfig) {
      logger.warn("Quickbase configuration not found in environment variables");
      logger.info(
        "Server will start but tools will not be functional until configuration is provided",
      );
      logger.info(
        "Required environment variables: QUICKBASE_REALM_HOST, QUICKBASE_USER_TOKEN",
      );
    }

    let quickbaseClient: QuickbaseClient | null = null;
    let cacheService: CacheService | null = null;

    if (hasConfig) {
      // Initialize Quickbase client with configuration
      const config: QuickbaseConfig = {
        realmHost: process.env.QUICKBASE_REALM_HOST || "",
        userToken: process.env.QUICKBASE_USER_TOKEN || "",
        appId: process.env.QUICKBASE_APP_ID,
        cacheEnabled: process.env.QUICKBASE_CACHE_ENABLED !== "false",
        cacheTtl: parseInt(process.env.QUICKBASE_CACHE_TTL || "3600", 10),
        debug: process.env.DEBUG === "true",
      };

      // Validate realm host format if provided
      if (
        config.realmHost &&
        !config.realmHost.match(/^[a-zA-Z0-9-]+\.quickbase\.com$/)
      ) {
        logger.error(
          "QUICKBASE_REALM_HOST must be in format: yourcompany.quickbase.com",
        );
        logger.warn("Continuing without Quickbase client initialization");
      } else {
        // Validate cache TTL
        if (isNaN(config.cacheTtl!) || config.cacheTtl! <= 0) {
          config.cacheTtl = 3600; // Default to 1 hour
          logger.warn("Invalid QUICKBASE_CACHE_TTL, using default: 3600");
        }

        try {
          quickbaseClient = new QuickbaseClient(config);
          cacheService = new CacheService(
            config.cacheTtl!,
            config.cacheEnabled,
          );

          // Initialize tools
          initializeTools(quickbaseClient, cacheService);
          logger.info("Quickbase client and tools initialized successfully");
        } catch (error) {
          logger.error("Failed to initialize Quickbase client", { error });
          logger.warn("Server will continue without functional tools");
        }
      }
    }

    // Register a configuration check tool that's always available
    server.tool(
      "check_configuration",
      "Check if Quickbase configuration is properly set up",
      {},
      async () => {
        const configured = !!quickbaseClient;
        const status = configured
          ? "Quickbase client is configured and ready"
          : "Quickbase client is not configured. Please set QUICKBASE_REALM_HOST and QUICKBASE_USER_TOKEN environment variables";

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  configured,
                  status,
                  requiredVars: [
                    "QUICKBASE_REALM_HOST",
                    "QUICKBASE_USER_TOKEN",
                  ],
                  optionalVars: [
                    "QUICKBASE_APP_ID",
                    "QUICKBASE_CACHE_ENABLED",
                    "QUICKBASE_CACHE_TTL",
                    "DEBUG",
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // Register tools with MCP server if client is initialized
    if (quickbaseClient) {
      const tools = toolRegistry.getAllTools();
      tools.forEach((tool) => {
        const schema = createMcpZodSchema(tool.paramSchema);

        server.tool(
          tool.name,
          tool.description,
          schema,
          async (params: Record<string, unknown>) => {
            try {
              logger.info(`Executing MCP tool: ${tool.name}`);
              const apiResponse = await tool.execute(params);

              // Handle API response - only return the data if successful
              if (!apiResponse.success || apiResponse.error) {
                const errorMessage =
                  apiResponse.error?.message || "Tool execution failed";
                logger.error(`Tool ${tool.name} failed`, {
                  error: apiResponse.error,
                });
                throw new Error(errorMessage);
              }

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(apiResponse.data, null, 2),
                  },
                ],
              };
            } catch (error) {
              logger.error(`Error executing MCP tool ${tool.name}`, { error });
              throw error;
            }
          },
        );

        logger.info(`Registered MCP tool: ${tool.name}`);
      });

      logger.info(`Registered ${tools.length} Quickbase tools with MCP Server`);
    } else {
      logger.info("No Quickbase tools registered (configuration missing)");
    }

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect and run
    await server.connect(transport);
    logger.info("MCP server connected via stdio and ready for requests");
  } catch (error) {
    logger.error("Failed to start MCP server", { error });
    await gracefulShutdown();
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  try {
    logger.info("Initiating graceful shutdown...");

    // Give pending operations time to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Cleanup cache instances
    const { CacheService } = await import("./utils/cache.js");
    const stats = CacheService.getStats();
    if (stats.instances > 0) {
      logger.info(`Cleaning up ${stats.instances} cache instances`);
    }

    logger.info("Graceful shutdown completed");
  } catch (error) {
    logger.error("Error during graceful shutdown", { error });
  }
}

// Install shutdown handlers
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received");
  await gracefulShutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received");
  await gracefulShutdown();
  process.exit(0);
});

// Start the server
main().catch(async (error) => {
  logger.error("Unhandled error in main", { error });
  await gracefulShutdown();
  process.exit(1);
});
