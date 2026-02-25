# Claude Guidelines for Quickbase MCP Server

######## IMPORTANT! SHELL TARGET: ZSH ######## IMPORTANT! SHELL TARGET: ZSH ########
All commands execute in ZSH. Use POSIX-compatible syntax. Never use bash-only syntax.
Avoid: $RANDOM, [[ ]], bash arrays, `which`. Use: command -v, [ ], grep -E, portable syntax.
######## IMPORTANT! SHELL TARGET: ZSH ######## IMPORTANT! SHELL TARGET: ZSH ########

## Naming Conventions

Files use **snake_case** (`create_record.ts`), not kebab-case. This deviates from many TypeScript projects.

## Architecture Deviations

### check_configuration is NOT a BaseTool

The `check_configuration` tool is registered directly in `src/mcp-stdio-server.ts` as an inline MCP handler — it does NOT extend `BaseTool` and is NOT in the tool registry. This is intentional: it must be available even when the Quickbase client fails to initialize (missing credentials). Every other tool goes through `BaseTool` and the registry.

### Tool Registration is NOT in registry.ts

Despite the name, `src/tools/registry.ts` only defines the `ToolRegistryImpl` class/singleton. Tools are registered via domain-specific `index.ts` files (e.g., `src/tools/records/index.ts`) which are called from `src/tools/index.ts:initializeTools()`. To add a new tool domain:
1. Create `src/tools/<domain>/index.ts` with a `register<Domain>Tools(client)` function
2. Call it from `src/tools/index.ts:initializeTools()`

### Dual Server Versions

The MCP server version is hardcoded in both `src/mcp-stdio-server.ts` and `src/mcp/server.ts`. Both must be updated when bumping versions (they are independent of `package.json`).

## Quickbase API Pitfalls

See [.claude/docs/quickbase-api-pitfalls.md](.claude/docs/quickbase-api-pitfalls.md) for Quickbase-specific API quirks that cause subtle bugs.

## Validation Limitations

`paramSchema` on tools is JSON Schema, but `createMcpZodSchema()` in `src/utils/validation.ts` converts it to Zod with **shallow** support only. Nested `type: "object"` becomes `z.record(z.unknown())` — nested property validation is NOT enforced at the MCP layer. Invalid nested values pass through and are rejected by the Quickbase API at runtime. This affects `groupBy`, `orderBy`, `summaryFields`, and any other array-of-objects parameters.

## Error Handling Pattern

Tools return `ApiResponse<T>` with `{ success, data?, error? }` — they do NOT throw from `execute()`. The `BaseTool.execute()` method catches all exceptions from `run()` and wraps them. However, the MCP server layer in `mcp-stdio-server.ts` re-throws errors (line ~150-170), so MCP clients see thrown errors, not ApiResponse. When writing tool `run()` methods, throw errors for failures — `BaseTool` handles the wrapping.

## Testing

- Tests mock `QuickbaseClient` — never make real API calls
- `integration.test.ts` tests tool registration counts and names; update it when adding/removing tools
- `tools.test.ts` tests the registry itself, including tool name assertions that must be updated for new tools

## Documentation

When adding tools or features, update:
- [README.md](README.md) — Available Tools section (user-facing)
- [docs/tools.md](docs/tools.md) — detailed tool reference with parameters and examples
- [CHANGELOG.md](CHANGELOG.md) — under the next unreleased version

Reference docs: [docs/](docs/README.md)
