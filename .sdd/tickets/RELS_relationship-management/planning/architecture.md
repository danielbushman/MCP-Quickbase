# Architecture: Relationship Management

## Overview

This feature adds a new `relationships` domain to the MCP Quickbase server, following the established patterns used by other domains (apps, tables, fields, etc.). The implementation consists of four tools mapping directly to the Quickbase Relationships API endpoints, with special attention to tool descriptions that clearly communicate destructive behavior to AI agents.

## Design Decisions

### Decision 1: Separate Relationships Domain

**Context:** Relationships could be implemented as part of the `tables` domain or as a new domain.

**Decision:** Create a new `src/tools/relationships/` domain directory.

**Rationale:**
- Follows existing pattern where each API resource area has its own domain
- Provides clear separation of concerns
- Allows for future expansion (e.g., cross-app relationship tools)
- Consistent with how `fields`, `records`, `files`, `reports` are organized

### Decision 2: Agent-Safety-First Tool Descriptions

**Context:** The delete operation is highly destructive, and agents may use tools without fully understanding consequences.

**Decision:** Implement a description format that:
1. Starts with clear action statement
2. Includes WARNING label for destructive operations
3. Lists exactly what will be deleted/lost
4. Suggests safer alternatives where applicable
5. Recommends user confirmation for destructive operations

**Rationale:**
- MCP tool descriptions are the primary way agents understand tool behavior
- Explicit warnings reduce risk of unintended data loss
- Following patterns from other enterprise API tools
- Aligns with user requirement for "clearly indicate potentially destructive changes"

### Decision 3: Flat Parameter Structure

**Context:** The API has nested structures for summary fields (accumulationType, where, label).

**Decision:** Use flat parameter structures with clear naming:
```typescript
{
  summary_field_id: number;
  summary_label: string;
  summary_accumulation_type: string;
  summary_where?: string;
}
```

**Rationale:**
- Matches existing tool patterns (e.g., `create_field`)
- Simpler for agents to construct
- Reduces nesting complexity in JSON Schema
- Clear parameter names are self-documenting

### Decision 4: TypeScript Interfaces for API Types

**Context:** Need to represent Quickbase API response types.

**Decision:** Define interfaces in each tool file for params and results, following existing patterns.

**Rationale:**
- Consistent with existing codebase (see `create_table.ts`, `create_field.ts`)
- Keeps related types close to their usage
- Enables strong typing throughout

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Existing codebase uses TypeScript with strict mode |
| Validation | Zod (via base class) | Already integrated in BaseTool |
| HTTP Client | QuickbaseClient | Existing client with retry, caching, rate limiting |
| Testing | Jest | Existing test framework |
| Linting | ESLint + Prettier | Existing configuration |

## Component Design

### Directory Structure

```
src/tools/relationships/
  index.ts                    # Domain registration and exports
  get_relationships.ts        # GET /relationships tool
  create_relationship.ts      # POST /relationships tool
  update_relationship.ts      # POST /relationships/{id} tool
  delete_relationship.ts      # DELETE /relationships/{id} tool
```

### Component 1: GetRelationshipsTool

**Responsibilities:**
- Query all relationships for a given table
- Support pagination (skip parameter)
- Return relationship metadata including lookup and summary fields

**Interface:**
```typescript
interface GetRelationshipsParams {
  table_id: string;      // Required: Child table ID (DBID)
  skip?: number;         // Optional: Pagination offset
}

interface GetRelationshipsResult {
  relationships: Relationship[];
  metadata: {
    totalRelationships: number;
    numRelationships: number;
    skip: number;
  };
}
```

**Description Format:**
```
Gets all table-to-table relationships for a specified table. Returns both relationships
where this table is the child (has reference fields pointing to parents) and where this
table is the parent (has child tables referencing it). Use this tool to explore table
structure and understand data connections before modifying relationships.
```

### Component 2: CreateRelationshipTool

**Responsibilities:**
- Create new relationship between tables
- Optionally create lookup fields during creation
- Optionally create summary field during creation

**Interface:**
```typescript
interface CreateRelationshipParams {
  table_id: string;              // Required: Child table ID
  parent_table_id: string;       // Required: Parent table ID
  foreign_key_label?: string;    // Optional: Label for reference field
  lookup_field_ids?: number[];   // Optional: Parent field IDs to create as lookups
  summary_field_id?: number;     // Optional: Child field ID to summarize
  summary_label?: string;        // Optional: Label for summary field
  summary_accumulation_type?: string;  // Required if summary_field_id: SUM/COUNT/AVG/MAX/MIN
  summary_where?: string;        // Optional: Quickbase query filter for summary
}

// Note: JSON Schema validation must enforce that summary_accumulation_type is required
// when summary_field_id is provided. Use conditional validation in paramSchema.

interface CreateRelationshipResult {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}
```

**Description Format:**
```
Creates a new table-to-table relationship linking a child table to a parent table.
This creates a reference field in the child table. Optionally creates lookup fields
(to display parent data in child records) and/or a summary field (to aggregate child
data in parent records). Relationships can only be created between tables in the same
application. This operation is SAFE and does not modify existing data.
```

### Component 3: UpdateRelationshipTool

**Responsibilities:**
- Add lookup fields to existing relationship
- Add summary field to existing relationship
- Does NOT delete existing fields (additive only)

**Interface:**
```typescript
interface UpdateRelationshipParams {
  table_id: string;              // Required: Child table ID
  relationship_id: number;       // Required: Relationship ID (foreign key field ID)
  lookup_field_ids?: number[];   // Optional: Additional parent field IDs for lookups
  summary_field_id?: number;     // Optional: Child field ID to summarize
  summary_label?: string;        // Optional: Label for summary field
  summary_accumulation_type?: string;  // Required if summary_field_id
  summary_where?: string;        // Optional: Quickbase query filter
}

// Note: JSON Schema validation must enforce that summary_accumulation_type is required
// when summary_field_id is provided. Use conditional validation in paramSchema.

interface UpdateRelationshipResult {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}
```

**Description Format:**
```
Adds lookup fields and/or summary fields to an existing relationship. This operation
is ADDITIVE ONLY - it will not delete existing lookup or summary fields. Use this to
enhance relationships with additional calculated fields. To remove fields from a
relationship, you must delete them individually using the field deletion tools.
```

### Component 4: DeleteRelationshipTool

**Responsibilities:**
- Delete entire relationship
- Clearly warn about data loss in description
- Return confirmation of what was deleted

**Interface:**
```typescript
interface DeleteRelationshipParams {
  table_id: string;        // Required: Child table ID
  relationship_id: number; // Required: Relationship ID to delete
}

interface DeleteRelationshipResult {
  relationshipId: number;
  deleted: boolean;
}
```

**Description Format (Critical for Agent Safety):**
```
WARNING: DESTRUCTIVE OPERATION - Permanently deletes an entire table-to-table
relationship INCLUDING ALL LOOKUP AND SUMMARY FIELDS associated with it. All data
in those fields will be permanently lost and CANNOT be recovered. The reference
field in the child table will NOT be deleted (it will remain and may need to be
manually deleted using field deletion tools if no longer needed). Before using
this tool:
1. Use get_relationships to see what fields will be deleted
2. Confirm with the user that they want to proceed
3. Consider if you only need to delete specific fields instead

Only use this tool when you are certain the entire relationship should be removed.
```

### Shared Types

```typescript
interface FieldInfo {
  id: number;
  label: string;
  type: string;
}

interface Relationship {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  isCrossApp: boolean;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}
```

## Data Flow

### Get Relationships Flow

```
Agent Request
    |
    v
GetRelationshipsTool.execute(params)
    |
    v
BaseTool.validateParams(params)
    |
    v
QuickbaseClient.request({
  method: 'GET',
  path: `/tables/${tableId}/relationships`,
  params: { skip }
})
    |
    v
Transform API Response
    |
    v
Return GetRelationshipsResult
```

### Create Relationship Flow

```
Agent Request
    |
    v
CreateRelationshipTool.execute(params)
    |
    v
BaseTool.validateParams(params)
    |
    v
Build Request Body (parentTableId, lookupFieldIds, summaryFields)
    |
    v
QuickbaseClient.request({
  method: 'POST',
  path: `/tables/${tableId}/relationships`,
  body: requestBody
})
    |
    v
Transform API Response
    |
    v
Return CreateRelationshipResult
```

### Delete Relationship Flow

```
Agent Request
    |
    v
DeleteRelationshipTool.execute(params)
    |
    v
BaseTool.validateParams(params)
    |
    v
QuickbaseClient.request({
  method: 'DELETE',
  path: `/tables/${tableId}/relationships/${relationshipId}`
})
    |
    v
Return DeleteRelationshipResult (confirmation)
```

## Integration Points

### Tool Registration

Update `src/tools/index.ts`:
```typescript
import { registerRelationshipTools } from './relationships';

export function initializeTools(client: QuickbaseClient, cacheService: CacheService): void {
  // ... existing registrations ...

  // Register relationship management tools
  registerRelationshipTools(client);

  // ...
}

export * from './relationships';
```

### API Endpoints

All tools use the existing `QuickbaseClient.request()` method with these endpoints:

| Tool | Method | Path |
|------|--------|------|
| get_relationships | GET | `/tables/{tableId}/relationships` |
| create_relationship | POST | `/tables/{tableId}/relationships` |
| update_relationship | POST | `/tables/{tableId}/relationships/{relationshipId}` |
| delete_relationship | DELETE | `/tables/{tableId}/relationships/{relationshipId}` |

### Caching Behavior

- GET requests are cached by `QuickbaseClient` by default
- Create/Update/Delete requests skip cache and may invalidate related cached data
- Consider adding `skipCache: true` for relationship queries if stale data is problematic

## Performance Considerations

### Rate Limiting

- Existing rate limiter (10 req/sec default) handles all requests
- Relationship operations are typically low-volume
- No special performance optimizations needed

### Response Size

- `get_relationships` may return large responses for tables with many relationships
- Pagination (skip parameter) is available for large result sets
- No need for custom pagination handling beyond exposing skip parameter

## Maintainability

### Code Organization

- Each tool in its own file with params/result interfaces
- Shared types can be extracted to a types file if needed later
- Registration pattern keeps index.ts clean

### Error Handling

- Use existing `ApiResponse` pattern with success/error states
- Throw descriptive errors that bubble up through BaseTool
- Include table ID and relationship ID in error context

### Documentation

- Tool descriptions serve as primary documentation for agents
- JSDoc comments on interfaces for developer documentation
- README update for human users

### Testing Strategy

- Unit tests for each tool following existing patterns
- Mock QuickbaseClient for isolation
- Test success, validation errors, API errors, and edge cases
- Specific tests for destructive operation handling
