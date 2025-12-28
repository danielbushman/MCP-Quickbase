# Plan: Relationship Management

## Overview

This document outlines the phased execution plan for implementing relationship management tools in the MCP Quickbase server. The plan follows a safety-first approach: read-only operations first, then write operations with explicit safety measures for destructive actions.

## Phases

### Phase 1: Foundation - Read Operations and Domain Setup

**Objective:** Establish the relationships domain and implement the read-only `get_relationships` tool, enabling agents to explore table structures safely.

**Deliverables:**
- `src/tools/relationships/` directory structure
- `src/tools/relationships/index.ts` with registration function
- `src/tools/relationships/get_relationships.ts` tool implementation
- `src/__tests__/tools/relationships.test.ts` with tests for get_relationships
- Update to `src/tools/index.ts` to register relationship tools

**Agent Assignments:**
- implement-feature: Create directory structure and index.ts registration pattern
- implement-feature: Implement GetRelationshipsTool with full type definitions
- implement-feature: Update main tools/index.ts to include relationships

**Acceptance Criteria:**
- [ ] `get_relationships` tool is registered and callable
- [ ] Returns correct relationship structure with foreignKeyField, lookupFields, summaryFields
- [ ] **API response structure validated against TypeScript interfaces** - Confirm actual Quickbase API responses match documented structure before proceeding to Phase 2
- [ ] Pagination (skip parameter) works correctly - Verify if API supports limit parameter and adjust if needed
- [ ] Tool description clearly explains what information is returned
- [ ] Unit tests cover success case, empty results, pagination, and API errors

### Phase 2: Write Operations - Create and Update

**Objective:** Implement non-destructive write operations that allow creating and enhancing relationships.

**Deliverables:**
- `src/tools/relationships/create_relationship.ts` tool implementation
- `src/tools/relationships/update_relationship.ts` tool implementation
- Extended tests in `src/__tests__/tools/relationships.test.ts`

**Agent Assignments:**
- implement-feature: Implement CreateRelationshipTool with lookup/summary field support
- implement-feature: Implement UpdateRelationshipTool (additive operations only)

**Acceptance Criteria:**
- [ ] `create_relationship` tool creates relationships with optional lookup/summary fields
- [ ] Tool description emphasizes this is a SAFE operation
- [ ] **JSON Schema conditional validation enforced** - summary_accumulation_type is required when summary_field_id is provided
- [ ] `update_relationship` tool adds fields to existing relationships
- [ ] Update tool description clearly states "ADDITIVE ONLY"
- [ ] Unit tests cover: basic creation, creation with lookups, creation with summary, validation errors
- [ ] Unit tests cover: update adding lookups, update adding summary, relationship not found
- [ ] Unit tests verify conditional validation: missing accumulation_type with summary_field_id fails validation

### Phase 3: Destructive Operations with Safety Measures

**Objective:** Implement the delete operation with comprehensive safety warnings and agent guidance.

**Deliverables:**
- `src/tools/relationships/delete_relationship.ts` tool implementation
- Complete test coverage for delete scenarios
- Final documentation updates

**Agent Assignments:**
- implement-feature: Implement DeleteRelationshipTool with safety-focused description
- implement-feature: Ensure all tests pass and coverage threshold met
- implement-feature: Update exports and verify tool registration

**Acceptance Criteria:**
- [ ] `delete_relationship` tool description starts with "WARNING: DESTRUCTIVE OPERATION"
- [ ] Description explicitly lists what will be deleted (lookup fields, summary fields)
- [ ] Description explicitly states data is permanently lost
- [ ] Description recommends using `get_relationships` first to review impact
- [ ] Description recommends confirming with user before proceeding
- [ ] Unit tests cover: successful deletion, relationship not found, API errors
- [ ] All four tools are registered and functional
- [ ] Test coverage meets or exceeds 40% threshold (lines/functions/statements) and 20% branches per jest.config.js

### Phase 4: Integration and Verification

**Objective:** Verify complete integration, ensure all tests pass, and validate agent safety measures.

**Deliverables:**
- Passing test suite with coverage >= 40% (lines/functions/statements) and >= 20% branches per jest.config.js
- All linting checks pass
- Verified tool descriptions for agent safety

**Agent Assignments:**
- verify-task: Run full test suite and validate coverage
- verify-task: Verify all tools are properly registered
- verify-task: Review tool descriptions for clarity and safety warnings
- commit-task: Commit all changes with descriptive message

**Acceptance Criteria:**
- [ ] `npm test` passes all tests
- [ ] `npm run lint` shows no errors
- [ ] All four relationship tools appear in tool registry
- [ ] Delete tool description contains required safety warnings
- [ ] Integration test validates end-to-end flow (if applicable)

## Dependencies

### Cross-Phase Dependencies

```
Phase 1 (Foundation)
    |
    +---> Phase 2 (Create/Update) [depends on domain setup]
    |
    +---> Phase 3 (Delete) [depends on domain setup, benefits from Phase 2 patterns]
              |
              +---> Phase 4 (Verification) [depends on all implementations]
```

### External Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `src/tools/base.ts` (BaseTool) | Existing | Available |
| `src/client/quickbase.ts` (QuickbaseClient) | Existing | Available |
| `src/tools/registry.ts` (toolRegistry) | Existing | Available |
| Quickbase Relationships API | External | Available |

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API schema differs from documentation | Medium | Medium | Start with get_relationships to validate response structure; adjust types as needed |
| Agent uses delete without understanding consequences | Medium | High | Comprehensive warning in tool description; recommend user confirmation |
| Test coverage falls below threshold | Low | Medium | Write tests concurrently with implementation; prioritize critical paths |
| Validation complexity for summary fields | Medium | Low | Clear error messages when accumulation_type missing; follow existing field patterns |

## Success Metrics

- [ ] All four relationship tools implemented and registered
- [ ] `get_relationships` returns accurate relationship data
- [ ] `create_relationship` successfully creates relationships with lookup/summary fields
- [ ] `update_relationship` adds fields without deleting existing ones
- [ ] `delete_relationship` has prominent destructive operation warnings
- [ ] Test coverage >= 40% lines/functions/statements, >= 20% branches (per jest.config.js)
- [ ] No lint errors
- [ ] Tool descriptions help agents understand when to use each tool
- [ ] Destructive operations clearly marked and explain consequences

## Implementation Notes

### Tool Naming Convention

Follow existing snake_case pattern:
- `get_relationships` (not `getRelationships`)
- `create_relationship` (not `createRelationship`)
- `update_relationship` (not `updateRelationship`)
- `delete_relationship` (not `deleteRelationship`)

### Parameter Naming Convention

Follow existing patterns:
- `table_id` (not `tableId`)
- `relationship_id` (not `relationshipId`)
- `parent_table_id` (not `parentTableId`)
- `lookup_field_ids` (not `lookupFieldIds`)

### Error Message Format

Include context for debugging:
```typescript
throw new Error(`Failed to get relationships for table ${tableId}: ${response.error?.message || 'Unknown error'}`);
```

### Logging Pattern

Use existing logger:
```typescript
const logger = createLogger('GetRelationshipsTool');
logger.info('Getting relationships for table', { tableId });
```
