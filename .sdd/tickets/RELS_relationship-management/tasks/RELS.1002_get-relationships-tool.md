# Task: [RELS.1002]: Implement GetRelationshipsTool

## Status
- [x] **Task completed** - acceptance criteria met
- [x] **Tests pass** - tests executed and passing (or N/A if no tests)
- [x] **Verified** - by the verify-task agent

**Note on "Tests pass"**:
- If tests were created/modified, you MUST run them and show output
- "Tests pass" means tests were EXECUTED and all passed
- "Tests pass - N/A" is only valid for documentation-only tickets
- Test file existence alone does NOT satisfy this requirement

## Agents
- implement-feature
- unit-test-runner
- verify-task
- commit-task

## Summary
Implement the `get_relationships` tool to query all table-to-table relationships for a given table, including support for pagination and complete relationship metadata.

## Background
This is the first read-only relationship tool, enabling agents to safely explore table structures and understand data connections. It's critical to validate the actual Quickbase API response structure before proceeding to write operations in Phase 2.

This implements Phase 1 from plan.md: Foundation - Read Operations.

## Acceptance Criteria
- [x] Tool name is `get_relationships` (snake_case)
- [x] Tool extends BaseTool with proper TypeScript types
- [x] Returns relationship structure with foreignKeyField, lookupFields, summaryFields
- [x] Pagination support via skip parameter works correctly
- [x] API response structure validated against TypeScript interfaces
- [x] Tool description clearly explains what information is returned
- [x] Tool registered in relationships/index.ts
- [x] Unit tests cover: success case, empty results, pagination, API errors
- [x] All tests pass with `npm test`

## Technical Requirements
- Endpoint: GET `/tables/{tableId}/relationships`
- Query parameters: skip (optional, for pagination)
- Response includes both parent and child relationships
- Return metadata: totalRelationships, numRelationships, skip
- Use QuickbaseClient.request() method for API calls
- Follow BaseTool pattern from existing tools
- TypeScript interfaces for GetRelationshipsParams and GetRelationshipsResult

## Implementation Notes
From architecture.md:

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

interface Relationship {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  isCrossApp: boolean;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}

interface FieldInfo {
  id: number;
  label: string;
  type: string;
}
```

Tool description format (from architecture.md):
```
Gets all table-to-table relationships for a specified table. Returns both relationships
where this table is the child (has reference fields pointing to parents) and where this
table is the parent (has child tables referencing it). Use this tool to explore table
structure and understand data connections before modifying relationships.
```

Use logging pattern:
```typescript
const logger = createLogger('GetRelationshipsTool');
logger.info('Getting relationships for table', { tableId });
```

## Dependencies
- RELS.1001 - Domain setup must be complete
- Existing: BaseTool, QuickbaseClient, toolRegistry

## Risk Assessment
- **Risk**: API response structure differs from documentation
  - **Mitigation**: Add logging to inspect actual responses; adjust interfaces as needed
- **Risk**: Pagination parameter not supported by API
  - **Mitigation**: Test with skip parameter; verify behavior matches expectations
- **Risk**: Cross-app relationships have different structure
  - **Mitigation**: Include isCrossApp flag and handle limited details appropriately

## Files/Packages Affected
- src/tools/relationships/get_relationships.ts (new file)
- src/tools/relationships/index.ts (update exports and registration)
- src/__tests__/tools/relationships.test.ts (new file)

## Deliverables Produced

Documents created in `deliverables/` directory:

- None

## Verification Notes
Verify-task agent should confirm:
- Tool name follows snake_case convention
- TypeScript interfaces match API response structure
- API response structure is validated before Phase 2 proceeds (critical!)
- Pagination works as expected
- Error messages include table ID context for debugging
- Tests cover all critical paths from quality-strategy.md:
  - Returns array of relationships with complete structure
  - Pagination works (skip parameter honored)
  - Empty array returned for tables with no relationships
  - Table not found (404)
  - Unauthorized (401)
  - Forbidden (403)
  - Network error
  - Table with many relationships
  - Cross-app relationships handled

## Verification Audit
<!-- Audit log maintained by verify-task agent for enterprise compliance -->
| Date | Agent | Decision | Notes |
|------|-------|----------|-------|
| 2025-12-28 | verify-task | PASS | All 9 acceptance criteria met, 100 tests passing, 100% coverage on get_relationships.ts |
