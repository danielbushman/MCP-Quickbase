# Task: [RELS.2001]: Implement CreateRelationshipTool

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
Implement the `create_relationship` tool to create new table-to-table relationships with optional lookup and summary fields.

## Background
This is the first write operation for relationships. It allows creating new relationships between tables, optionally including lookup fields (to display parent data in child records) and summary fields (to aggregate child data in parent records). The tool must emphasize this is a SAFE operation that doesn't modify existing data.

This implements Phase 2 from plan.md: Write Operations - Create and Update.

## Acceptance Criteria
- [x] Tool name is `create_relationship` (snake_case)
- [x] Tool extends BaseTool with proper TypeScript types
- [x] Creates basic relationships (parent + child table only)
- [x] Supports optional lookup_field_ids parameter
- [x] Supports optional summary field parameters
- [x] JSON Schema conditional validation: summary_accumulation_type required when summary_field_id provided
- [x] Tool description emphasizes this is a SAFE operation
- [x] Tool registered in relationships/index.ts
- [x] Unit tests cover all parameter combinations and validation scenarios
- [x] All tests pass with `npm test`

## Technical Requirements
- Endpoint: POST `/tables/{tableId}/relationships`
- Parameters follow flat structure from architecture.md
- Support all summary accumulation types: SUM, COUNT, AVG, MAX, MIN
- Support optional summary_where filter
- Build request body from flat parameters
- Return complete relationship structure including created fields
- Conditional validation: summary_accumulation_type is required if summary_field_id is provided

## Implementation Notes
From architecture.md:

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

interface CreateRelationshipResult {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}
```

JSON Schema must use conditional validation:
```typescript
paramSchema = {
  type: 'object',
  properties: { /* ... */ },
  required: ['table_id', 'parent_table_id'],
  // Add conditional validation
  if: {
    properties: { summary_field_id: { type: 'number' } },
    required: ['summary_field_id']
  },
  then: {
    required: ['summary_accumulation_type']
  }
};
```

Tool description (from architecture.md):
```
Creates a new table-to-table relationship linking a child table to a parent table.
This creates a reference field in the child table. Optionally creates lookup fields
(to display parent data in child records) and/or a summary field (to aggregate child
data in parent records). Relationships can only be created between tables in the same
application. This operation is SAFE and does not modify existing data.
```

## Dependencies
- RELS.1001 - Domain setup complete
- RELS.1002 - GetRelationshipsTool provides validation pattern
- RELS.1003 - Registration infrastructure ready

## Risk Assessment
- **Risk**: Validation complexity for conditional summary parameters
  - **Mitigation**: Use JSON Schema conditional validation; clear error messages
- **Risk**: Creating relationship that already exists
  - **Mitigation**: Handle API error gracefully; include helpful error message
- **Risk**: Tables in different applications
  - **Mitigation**: API will reject; surface error message clearly

## Files/Packages Affected
- src/tools/relationships/create_relationship.ts (new file)
- src/tools/relationships/index.ts (update exports and registration)
- src/__tests__/tools/relationships.test.ts (extend tests)

## Deliverables Produced

Documents created in `deliverables/` directory:

- None

## Verification Notes
Verify-task agent should confirm tests cover all critical paths from quality-strategy.md:

Happy Path:
- Basic relationship creation (parent + child only)
- With lookup field IDs
- With summary field (all accumulation types: SUM, COUNT, AVG, MAX, MIN)
- With both lookup and summary fields

Error Cases:
- Parent table not found
- Invalid field IDs for lookups
- Missing accumulation type when summary_field_id provided (validated by JSON Schema)
- Tables in different apps

Edge Cases:
- Creating relationship that already exists
- Summary field with WHERE filter

Verify conditional validation works:
- Providing summary_field_id without summary_accumulation_type MUST fail validation
- Error message clearly explains missing accumulation_type

## Verification Audit
<!-- Audit log maintained by verify-task agent for enterprise compliance -->
| Date | Agent | Decision | Notes |
|------|-------|----------|-------|
| 2025-12-28 | verify-task | PASS | All 10 acceptance criteria met, 123 tests passing, 100% line/branch/statement coverage on create_relationship.ts |
