# Task: [RELS.3001]: Implement DeleteRelationshipTool with Safety Warnings

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
Implement the `delete_relationship` tool with comprehensive safety warnings and agent guidance to prevent unintended data loss.

## Background
This is a DESTRUCTIVE operation that permanently deletes relationships and all associated lookup/summary fields. The tool description must start with "WARNING: DESTRUCTIVE OPERATION" and explicitly list what will be deleted, what data will be lost, and recommend user confirmation before proceeding.

This implements Phase 3 from plan.md: Destructive Operations with Safety Measures.

## Acceptance Criteria
- [x] Tool name is `delete_relationship` (snake_case)
- [x] Tool description starts with "WARNING: DESTRUCTIVE OPERATION"
- [x] Description explicitly lists what will be deleted (lookup fields, summary fields)
- [x] Description explicitly states data is permanently lost
- [x] Description recommends using get_relationships first to review impact
- [x] Description recommends confirming with user before proceeding
- [x] Tool extends BaseTool with proper TypeScript types
- [x] Successfully deletes relationships via API
- [x] Returns confirmation with relationship ID
- [x] Tool registered in relationships/index.ts
- [x] Unit tests cover: successful deletion, relationship not found, API errors
- [x] All tests pass with `npm test`

## Technical Requirements
- Endpoint: DELETE `/tables/{tableId}/relationships/{relationshipId}`
- Simple parameters: table_id and relationship_id
- Return confirmation of deletion with relationship ID
- Clear error messages for failures
- No actual data validation needed (API handles it)

## Implementation Notes
From architecture.md:

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

Tool description (CRITICAL - from architecture.md):
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

Implementation pattern:
```typescript
const logger = createLogger('DeleteRelationshipTool');
logger.warn('Deleting relationship', { tableId, relationshipId });

const response = await this.client.request({
  method: 'DELETE',
  path: `/tables/${tableId}/relationships/${relationshipId}`
});

return {
  relationshipId: params.relationship_id,
  deleted: true
};
```

## Dependencies
- RELS.1001 - Domain setup complete
- RELS.1002 - GetRelationshipsTool (referenced in safety instructions)
- RELS.2001, RELS.2002 - Create/Update tools provide patterns

## Risk Assessment
- **Risk**: Agent uses delete without understanding consequences
  - **Mitigation**: Comprehensive warning in tool description; recommend user confirmation
- **Risk**: Agent doesn't check what will be deleted first
  - **Mitigation**: Description explicitly recommends using get_relationships first
- **Risk**: Agent deletes wrong relationship
  - **Mitigation**: Require relationship_id parameter; include clear error messages

## Files/Packages Affected
- src/tools/relationships/delete_relationship.ts (new file)
- src/tools/relationships/index.ts (update exports and registration)
- src/__tests__/tools/relationships.test.ts (extend tests)

## Deliverables Produced

Documents created in `deliverables/` directory:

- None

## Verification Notes
Verify-task agent MUST confirm tool description safety from quality-strategy.md:

CRITICAL - Safety Verification:
- [x] Tool description contains "WARNING"
- [x] Tool description contains "DESTRUCTIVE"
- [x] Tool description mentions lookup fields deletion
- [x] Tool description mentions summary fields deletion
- [x] Tool description mentions data loss is permanent
- [x] Tool description recommends get_relationships first
- [x] Tool description recommends user confirmation

Test Coverage (from quality-strategy.md):
Happy Path:
- Successful deletion returns relationship ID
- deleted: true in result

Error Cases:
- Relationship not found (404)
- Unauthorized (401)
- Forbidden (403)

Edge Cases:
- Deleting relationship with many lookup/summary fields
- API error messages preserved in response

Additional Verification:
- Use logger.warn() for deletion operations (not logger.info())
- Error messages include context (table ID, relationship ID)
- Result structure matches DeleteRelationshipResult interface

## Verification Audit
<!-- Audit log maintained by verify-task agent for enterprise compliance -->
| Date | Agent | Decision | Notes |
|------|-------|----------|-------|
| 2025-12-28 | verify-task | PASS | All 12 acceptance criteria met, all 7 safety warnings verified, 229/229 tests passing, 100% line coverage on delete_relationship.ts |
