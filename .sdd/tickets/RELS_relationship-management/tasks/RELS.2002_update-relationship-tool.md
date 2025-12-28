# Task: [RELS.2002]: Implement UpdateRelationshipTool

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
Implement the `update_relationship` tool to add lookup and summary fields to existing relationships. This tool is ADDITIVE ONLY - it will not delete existing fields.

## Background
This tool enhances existing relationships by adding new lookup or summary fields. It's critical that agents understand this is additive only - fields can only be removed by using separate field deletion tools. The tool description must clearly state "ADDITIVE ONLY" to prevent confusion.

This completes Phase 2 from plan.md: Write Operations - Create and Update.

## Acceptance Criteria
- [x] Tool name is `update_relationship` (snake_case)
- [x] Tool extends BaseTool with proper TypeScript types
- [x] Adds lookup fields to existing relationships
- [x] Adds summary fields to existing relationships
- [x] JSON Schema conditional validation: summary_accumulation_type required when summary_field_id provided
- [x] Tool description clearly states "ADDITIVE ONLY"
- [x] Tool description explains how to remove fields (use field deletion tools)
- [x] Tool registered in relationships/index.ts
- [x] Unit tests cover additive behavior and all error scenarios
- [x] All tests pass with `npm test`

## Technical Requirements
- Endpoint: POST `/tables/{tableId}/relationships/{relationshipId}`
- Parameters similar to create_relationship but require relationship_id
- Support adding lookup_field_ids
- Support adding summary field with accumulation type
- Conditional validation: summary_accumulation_type required if summary_field_id provided
- Return updated relationship structure
- Does NOT delete existing fields (API behavior, verify in tests)

## Implementation Notes
From architecture.md:

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

interface UpdateRelationshipResult {
  id: number;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: FieldInfo;
  lookupFields: FieldInfo[];
  summaryFields: FieldInfo[];
}
```

JSON Schema must use same conditional validation as create_relationship:
```typescript
if: {
  properties: { summary_field_id: { type: 'number' } },
  required: ['summary_field_id']
},
then: {
  required: ['summary_accumulation_type']
}
```

Tool description (from architecture.md):
```
Adds lookup fields and/or summary fields to an existing relationship. This operation
is ADDITIVE ONLY - it will not delete existing lookup or summary fields. Use this to
enhance relationships with additional calculated fields. To remove fields from a
relationship, you must delete them individually using the field deletion tools.
```

## Dependencies
- RELS.1001 - Domain setup complete
- RELS.2001 - CreateRelationshipTool provides pattern for summary validation
- Existing: Field deletion tools (mentioned in description)

## Risk Assessment
- **Risk**: Agents expect update to replace fields instead of adding
  - **Mitigation**: Clear "ADDITIVE ONLY" in description; test and document behavior
- **Risk**: Adding fields that already exist
  - **Mitigation**: Handle API response appropriately; test edge case
- **Risk**: Empty update (no fields to add)
  - **Mitigation**: Allow but may be no-op; test and document behavior

## Files/Packages Affected
- src/tools/relationships/update_relationship.ts (new file)
- src/tools/relationships/index.ts (update exports and registration)
- src/__tests__/tools/relationships.test.ts (extend tests)

## Deliverables Produced

Documents created in `deliverables/` directory:

- None

## Verification Notes
Verify-task agent should confirm tests cover all critical paths from quality-strategy.md:

Happy Path:
- Add lookup fields to existing relationship
- Add summary field to existing relationship
- Add both lookup and summary fields

Error Cases:
- Relationship not found
- Invalid lookup field IDs
- Missing accumulation type when summary_field_id provided (validated by JSON Schema)

Edge Cases:
- Adding fields that already exist (verify additive behavior)
- Empty update (no fields to add)

Verify conditional validation works:
- Providing summary_field_id without summary_accumulation_type MUST fail validation

Verify additive behavior:
- Adding new lookup fields doesn't remove existing ones
- Adding summary field doesn't affect existing lookups
- Result includes ALL fields (existing + newly added)

## Verification Audit
<!-- Audit log maintained by verify-task agent for enterprise compliance -->
| Date | Agent | Decision | Notes |
|------|-------|----------|-------|
| 2025-12-28 | verify-task | PASS | All 10 acceptance criteria met, 143 tests passing, 100% coverage on relationships tools |
