import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createLogger } from "./utils/logger";
import { QuickbaseClient } from "./client/quickbase";
import { QuickbaseConfig } from "./types/config";
import { CacheService } from "./utils/cache";
import { initializeTools, toolRegistry } from "./tools";
import { McpRequest } from "./types/mcp";
import {
  createMcpServer,
  createHttpTransport,
  handleMcpRequest,
  registerMcpTools,
} from "./mcp";

// Load environment variables
dotenv.config();

const logger = createLogger("server");

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Configuration
const PORT = process.env.PORT || 3536; // Changed from 3000 to avoid port conflicts

// Initialize Quickbase client
let quickbaseClient: QuickbaseClient | null = null;
let cacheService: CacheService | null = null;

// Track connector status
const connectorStatus = {
  status: "disconnected",
  error: null as string | null,
};

// Initialize MCP server and transport
const mcpServer = createMcpServer();
const mcpTransport = createHttpTransport();

/**
 * Initialize Quickbase client from environment variables
 */
function initializeClient(): void {
  try {
    // Validate required environment variables
    const realmHost = process.env.QUICKBASE_REALM_HOST;
    const userToken = process.env.QUICKBASE_USER_TOKEN;

    if (!realmHost) {
      throw new Error("QUICKBASE_REALM_HOST environment variable is required");
    }

    if (!userToken) {
      throw new Error("QUICKBASE_USER_TOKEN environment variable is required");
    }

    // Safely parse cache TTL with validation
    const cacheTtlStr = process.env.QUICKBASE_CACHE_TTL || "3600";
    const cacheTtl = parseInt(cacheTtlStr, 10);
    if (isNaN(cacheTtl) || cacheTtl <= 0) {
      throw new Error(
        `Invalid QUICKBASE_CACHE_TTL value: ${cacheTtlStr}. Must be a positive integer.`,
      );
    }

    const config: QuickbaseConfig = {
      realmHost,
      userToken,
      appId: process.env.QUICKBASE_APP_ID,
      cacheEnabled: process.env.QUICKBASE_CACHE_ENABLED !== "false",
      cacheTtl,
      debug: process.env.DEBUG === "true",
    };

    quickbaseClient = new QuickbaseClient(config);
    cacheService = new CacheService(config.cacheTtl, config.cacheEnabled);

    // Initialize MCP tools
    initializeTools(quickbaseClient, cacheService);

    // Register tools with MCP server after initialization
    registerMcpTools(mcpServer);

    connectorStatus.status = "connected";
    connectorStatus.error = null;

    logger.info("Quickbase client initialized successfully");
    logger.info(`Registered tools: ${toolRegistry.getToolNames().join(", ")}`);
  } catch (error) {
    connectorStatus.status = "error";
    connectorStatus.error =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to initialize Quickbase client", { error });
  }
}

// MCP tool execution endpoint
app.post("/api/:tool", async (req, res) => {
  const toolName = req.params.tool;
  const params = req.body || {};

  logger.info(`Executing tool: ${toolName}`, { params });

  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Quickbase client not initialized",
        type: "ConfigurationError",
      },
    });
  }

  const tool = toolRegistry.getTool(toolName);

  if (!tool) {
    return res.status(404).json({
      success: false,
      error: {
        message: `Tool ${toolName} not found`,
        type: "NotFoundError",
      },
    });
  }

  try {
    const result = await tool.execute(params);
    res.json(result);
  } catch (error) {
    logger.error(`Error executing tool ${toolName}`, { error });
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.name : "UnknownError",
      },
    });
  }
});

// MCP batch tool execution
app.post("/api/batch", async (req, res) => {
  const requests = req.body.requests || [];

  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Invalid batch request format",
        type: "ValidationError",
      },
    });
  }

  logger.info(`Executing batch request with ${requests.length} tools`);

  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Quickbase client not initialized",
        type: "ConfigurationError",
      },
    });
  }

  try {
    const results = await Promise.all(
      requests.map(async (request: McpRequest) => {
        const tool = toolRegistry.getTool(request.tool);

        if (!tool) {
          return {
            tool: request.tool,
            success: false,
            error: {
              message: `Tool ${request.tool} not found`,
              type: "NotFoundError",
            },
          };
        }

        try {
          const result = await tool.execute(request.params || {});
          return {
            tool: request.tool,
            ...result,
          };
        } catch (error) {
          return {
            tool: request.tool,
            success: false,
            error: {
              message: error instanceof Error ? error.message : "Unknown error",
              type: error instanceof Error ? error.name : "UnknownError",
            },
          };
        }
      }),
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error("Error executing batch request", { error });
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.name : "UnknownError",
      },
    });
  }
});

// MCP schema endpoint
app.get("/api/schema", (_req, res) => {
  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Quickbase client not initialized",
        type: "ConfigurationError",
      },
    });
  }

  const tools = toolRegistry.getAllTools().map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.paramSchema,
  }));

  res.json({
    success: true,
    data: {
      tools,
    },
  });
});

// Status route
app.get("/status", (_req, res) => {
  res.json({
    name: "Quickbase MCP Server",
    version: "2.3.0",
    status: connectorStatus.status,
    error: connectorStatus.error,
    tools: quickbaseClient ? toolRegistry.getToolNames() : [],
  });
});

// MCP Protocol routes
// POST endpoint for MCP messages
app.post("/mcp", async (req, res) => {
  if (!quickbaseClient) {
    return res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Quickbase client not initialized",
      },
      id: req.body?.id || null,
    });
  }

  try {
    logger.info("Received MCP protocol request");
    await handleMcpRequest(mcpServer, mcpTransport, req, res);
  } catch (error) {
    logger.error("Error handling MCP protocol request", { error });
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      id: req.body?.id || null,
    });
  }
});

// GET endpoint for MCP long-polling notifications
app.get("/mcp", async (req, res) => {
  try {
    logger.info("Received MCP protocol GET request for notifications");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Keep connection open for server-sent events
    const interval = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (error) {
    logger.error("Error handling MCP protocol notifications", { error });
    res.status(500).end();
  }
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Quickbase MCP Server v2 server running on port ${PORT}`);

  // Initialize Quickbase client
  initializeClient();

  // Connect the MCP server to its transport
  try {
    await mcpServer.connect(mcpTransport);
    logger.info("MCP server connected successfully");
  } catch (error) {
    logger.error("Failed to connect MCP server", { error });
  }
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  cleanup();
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  cleanup();
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error });
  cleanup();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", { reason, promise });
  cleanup();
  process.exit(1);
});

function cleanup(): void {
  try {
    // Close cache connections
    if (cacheService) {
      logger.info("Closing cache service");
      // Note: Cache service cleanup should be implemented if it has cleanup methods
    }

    // Close any other resources
    logger.info("Cleanup completed");
  } catch (error) {
    logger.error("Error during cleanup", { error });
  }
}

// Export for testing
export default app;
