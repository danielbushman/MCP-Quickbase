# Analysis: Relationship Management

## Problem Definition

The MCP Quickbase server currently lacks support for managing table-to-table relationships through the Quickbase API. Relationships are a fundamental feature in Quickbase that allow linking records between tables, creating lookup fields (to display parent data in child records), and summary fields (to aggregate child data in parent records). Without relationship management capabilities, agents cannot:

1. Query existing relationships between tables
2. Create new relationships to link tables
3. Add lookup/summary fields to existing relationships
4. Delete relationships when no longer needed

This gap significantly limits the utility of the MCP server for database schema management and application configuration tasks.

## Context

### Why This Work Is Needed

Quickbase applications commonly have complex table structures with multiple relationships. Common use cases include:

- **Project Management**: Projects (parent) -> Tasks (child) with lookup fields for project name, summary fields for task counts
- **CRM**: Customers (parent) -> Orders (child) with summary fields for total revenue
- **Inventory**: Warehouses (parent) -> Products (child) with lookup fields for location info

Agents need to understand and modify these relationships to:
- Explore application schemas
- Create new tables with proper relationships
- Add calculated fields that span relationships
- Refactor application structure

### Quickbase Relationships API

The Quickbase RESTful API provides four endpoints for relationship management:

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get Relationships | GET | `/v1/tables/{tableId}/relationships` | List all relationships for a table |
| Create Relationship | POST | `/v1/tables/{tableId}/relationships` | Create a new relationship with optional lookup/summary fields |
| Update Relationship | POST | `/v1/tables/{tableId}/relationships/{relationshipId}` | Add lookup/summary fields to existing relationship |
| Delete Relationship | DELETE | `/v1/tables/{tableId}/relationships/{relationshipId}` | Delete relationship and all associated lookup/summary fields |

## Existing Solutions

### Industry Patterns

Other database management tools handle relationships similarly:
- **Airtable API**: Provides link fields and rollup fields with similar semantics
- **Notion API**: Relations and rollups follow a comparable pattern
- **Microsoft Power Platform**: Dataverse relationships use similar parent-child paradigms

### Codebase Patterns

The existing codebase has established patterns for tool implementation:

1. **Tool Structure** (`src/tools/base.ts`):
   - Tools extend `BaseTool<TParams, TResult>`
   - Implement `name`, `description`, `paramSchema`, and `run()` method
   - Use `QuickbaseClient` for API calls

2. **Domain Organization** (`src/tools/index.ts`):
   - Tools grouped by domain (apps, tables, fields, records, files, reports)
   - Each domain has `index.ts` with `register*Tools()` function
   - Exports tool classes and registration function

3. **API Client Pattern** (`src/client/quickbase.ts`):
   - Uses `request()` method with `RequestOptions`
   - Supports GET, POST, PUT, DELETE, PATCH methods
   - Automatic retry, caching (for GET), and rate limiting

4. **Type Definitions**:
   - Interfaces for params and results defined in tool files
   - JSON Schema for `paramSchema` used by MCP protocol
   - Zod validation happens in base class

## Current State

The codebase currently supports:
- **Apps**: create, update, list tables
- **Tables**: create, update, get fields
- **Fields**: create, update
- **Records**: create, update, query, bulk operations
- **Files**: upload, download
- **Reports**: run

Relationships are **not** currently supported. The `getTableFields` tool returns field information but does not include relationship metadata.

## Research Findings

### API Response Structures

From the Quickbase API documentation (via Microsoft Learn connector reference):

**Relationship Object**:
```typescript
interface Relationship {
  id: number;                    // Relationship ID (foreign key field ID)
  parentTableId: string;         // Parent table DBID
  childTableId: string;          // Child table DBID
  foreignKeyField: {             // Reference field in child table
    id: number;
    label: string;
    type: string;
  };
  isCrossApp: boolean;           // Whether cross-app relationship
  lookupFields: Array<{          // Lookup fields from parent
    id: number;
    label: string;
    type: string;
  }>;
  summaryFields: Array<{         // Summary fields in parent
    id: number;
    label: string;
    type: string;
  }>;
}
```

**Get Relationships Response**:
```typescript
interface GetRelationshipsResponse {
  relationships: Relationship[];
  metadata: {
    skip: number;
    totalRelationships: number;
    numRelationships: number;
  };
}
```

### Destructive Operation Warning

**DELETE Relationship is highly destructive**:
- Deletes ALL lookup fields associated with the relationship
- Deletes ALL summary fields associated with the relationship
- Data in those fields is permanently lost
- The reference field itself is NOT deleted
- Cannot be undone

This is the most destructive operation in this feature set and requires special handling for agent safety.

### Key Constraints

1. **Same-App Only**: Relationships can only be created between tables in the same app (cross-app relationships are read-only)
2. **Reference Field Persistence**: The reference (foreign key) field remains after relationship deletion
3. **Additive Updates**: Updating relationships only adds fields; existing fields are not deleted
4. **Summary Field Complexity**: Summary fields require accumulation type (SUM, COUNT, AVG, MAX, MIN) and optional WHERE filter

## Constraints

### Technical Constraints

1. **Quickbase API Limits**: Standard rate limiting applies (handled by existing client)
2. **Table ID Required**: All operations require the child table ID
3. **Relationship ID**: Required for update/delete; equals the foreign key field ID
4. **Field Types**: Lookup/summary field types are determined by source fields

### Business Constraints

1. **Destructive Operations**: Must warn agents clearly about data loss
2. **User Confirmation**: Destructive operations should request user confirmation
3. **Consistency**: Must follow existing tool patterns and naming conventions

### Time Constraints

1. Focus on core CRUD operations first
2. Advanced features (cross-app relationship viewing) can be deferred

## Success Criteria

### Functional Requirements

- [ ] `get_relationships` tool lists all relationships for a table with complete metadata
- [ ] `create_relationship` tool creates relationships with optional lookup/summary fields
- [ ] `update_relationship` tool adds lookup/summary fields to existing relationships
- [ ] `delete_relationship` tool removes relationships with appropriate warnings

### Non-Functional Requirements

- [ ] Tool descriptions clearly indicate destructive operations
- [ ] Delete operation description strongly warns about data loss
- [ ] All tools follow existing codebase patterns (BaseTool, naming, types)
- [ ] Unit test coverage >= 35% (existing threshold)
- [ ] All tools include parameter validation via JSON Schema
- [ ] Error messages are actionable and specific

### Agent Safety Requirements

- [ ] Destructive tool descriptions include "DESTRUCTIVE" or "WARNING" labels
- [ ] Delete tool description explains exactly what will be lost
- [ ] Descriptions help agents understand when each tool is appropriate
- [ ] Create/Update operations clearly explain their non-destructive nature
