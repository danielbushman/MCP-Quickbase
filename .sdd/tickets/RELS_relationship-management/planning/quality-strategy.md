# Quality Strategy: Relationship Management

## Testing Philosophy

This feature follows enterprise-grade testing principles with comprehensive coverage of both happy paths and error scenarios. Given the destructive nature of the delete operation, testing must verify that tool descriptions accurately communicate risks and that error handling prevents unintended data loss.

Testing priorities:
1. **Critical paths** - All CRUD operations must work correctly
2. **Error handling** - API errors, validation errors, and edge cases
3. **Safety verification** - Delete tool description contains required warnings
4. **Integration** - Tools register correctly and are callable through MCP

## Coverage Requirements

**Minimum Thresholds (from jest.config.js):**
- Line coverage: 40%
- Function coverage: 40%
- Statement coverage: 40%
- Branch coverage: 20%

**Target Thresholds:**
- Line coverage: 80% for new relationship tools
- Branch coverage: 70% for new relationship tools

**Note:** The minimum thresholds are enforced by jest.config.js and represent hard requirements. The target thresholds are aspirational goals for new relationship tool code quality.

**Coverage Focus Areas:**
- All tool `run()` methods
- Parameter validation paths
- Error handling branches
- Response transformation logic

## Test Types

### Unit Tests

**Scope:** Individual tool classes with mocked QuickbaseClient

**Tools:** Jest with ts-jest

**Coverage Target:** >= 80% for new code

**What to Test:**

1. **Tool Properties**
   - Correct `name` value
   - Description is non-empty string
   - `paramSchema` is valid JSON Schema object

2. **Happy Path Execution**
   - Successful API responses transformed correctly
   - All response fields mapped properly
   - Metadata included in results

3. **Parameter Validation**
   - Required parameters validated
   - Invalid parameter types rejected
   - Optional parameters handled correctly

4. **Error Handling**
   - API errors (4xx, 5xx) handled gracefully
   - Network errors caught and reported
   - Validation errors include helpful messages

5. **Edge Cases**
   - Empty relationship lists
   - Relationships with no lookup/summary fields
   - Large relationship counts (pagination)

### Integration Tests

**Scope:** Tool registration and end-to-end execution flow

**Approach:** Test that tools are registered and callable through the registry

**What to Test:**
- All four tools appear in `toolRegistry.getAllTools()`
- Tools can be retrieved by name via `toolRegistry.getTool()`
- Execute returns proper `ApiResponse` structure

### End-to-End Tests

**Scope:** Not required for initial release

**Note:** E2E tests against real Quickbase API would require test credentials and are deferred to future work.

## Critical Paths

The following paths MUST have comprehensive test coverage:

### 1. Get Relationships

**Happy Path:**
- Returns array of relationships with complete structure
- Pagination works (skip parameter honored)
- Empty array returned for tables with no relationships

**Error Cases:**
- Table not found (404)
- Unauthorized (401)
- Forbidden (403)
- Network error

**Edge Cases:**
- Table with many relationships (pagination needed)
- Cross-app relationships have limited details

### 2. Create Relationship

**Happy Path:**
- Basic relationship creation (parent + child only)
- With lookup field IDs
- With summary field (all accumulation types)
- With both lookup and summary fields

**Error Cases:**
- Parent table not found
- Invalid field IDs for lookups
- Missing accumulation type when summary_field_id provided (must be validated via JSON Schema)
- Tables in different apps

**Edge Cases:**
- Creating relationship that already exists
- Summary field with WHERE filter

### 3. Update Relationship

**Happy Path:**
- Add lookup fields to existing relationship
- Add summary field to existing relationship
- Add both lookup and summary fields

**Error Cases:**
- Relationship not found
- Invalid lookup field IDs
- Missing accumulation type when summary_field_id provided (must be validated via JSON Schema)

**Edge Cases:**
- Adding fields that already exist (additive behavior)
- Empty update (no fields to add)

### 4. Delete Relationship (CRITICAL - Extra Coverage Required)

**Happy Path:**
- Successful deletion returns relationship ID
- All lookup/summary fields deleted

**Error Cases:**
- Relationship not found (404)
- Unauthorized (401)
- Forbidden (403)

**Safety Verification:**
- Tool description contains "WARNING"
- Tool description contains "DESTRUCTIVE"
- Tool description mentions lookup fields deletion
- Tool description mentions summary fields deletion
- Tool description mentions data loss is permanent
- Tool description recommends `get_relationships` first
- Tool description recommends user confirmation

## Negative Testing Requirements

### Invalid Inputs

| Test Case | Input | Expected |
|-----------|-------|----------|
| Empty table_id | `""` | Validation error |
| Missing table_id | `undefined` | Validation error |
| Invalid table_id type | `123` (number) | Validation error |
| Empty relationship_id (for update/delete) | `undefined` | Validation error |
| Invalid accumulation_type | `"INVALID"` | API error or validation error |
| Non-numeric field IDs | `["abc"]` | Validation error |

### API Error Handling

| Status Code | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| 400 | Bad request | Return error with message |
| 401 | Invalid token | Return auth error |
| 403 | No permission | Return forbidden error |
| 404 | Not found | Return not found error |
| 429 | Rate limited | Retry (handled by client) |
| 500 | Server error | Return server error |

### Authorization Failures

- Test with invalid/expired token (mocked)
- Test access to table without permissions (mocked)

### Resource Not Found

- Non-existent table ID
- Non-existent relationship ID
- Non-existent parent table ID

## Test Data Strategy

### Mocking Approach

All tests use mocked `QuickbaseClient`:

```typescript
jest.mock('../../client/quickbase');

const mockClient = new QuickbaseClient(config) as jest.Mocked<QuickbaseClient>;
mockClient.request = jest.fn().mockResolvedValue(mockResponse);
```

### Mock Response Templates

```typescript
// Relationship structure
const mockRelationship = {
  id: 123,
  parentTableId: 'parent-table-id',
  childTableId: 'child-table-id',
  foreignKeyField: {
    id: 123,
    label: 'Related Parent',
    type: 'numeric'
  },
  isCrossApp: false,
  lookupFields: [
    { id: 456, label: 'Parent Name', type: 'text' }
  ],
  summaryFields: [
    { id: 789, label: 'Child Count', type: 'numeric' }
  ]
};

// Get relationships response
const mockGetResponse = {
  success: true,
  data: {
    relationships: [mockRelationship],
    metadata: {
      totalRelationships: 1,
      numRelationships: 1,
      skip: 0
    }
  }
};

// Create/Update response
const mockCreateResponse = {
  success: true,
  data: mockRelationship
};

// Delete response
const mockDeleteResponse = {
  success: true,
  data: {
    relationshipId: 123
  }
};

// Error response
const mockErrorResponse = {
  success: false,
  error: {
    message: 'Table not found',
    code: 404,
    type: 'NotFoundError'
  }
};
```

## Quality Gates

Before verification, all items must be checked:

### Code Quality

- [ ] All unit tests pass (`npm test`)
- [ ] Coverage thresholds met (40% lines/functions/statements, 20% branches per jest.config.js)
- [ ] No linting errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run build`)

### Functional Completeness

- [ ] All four tools implemented
- [ ] All tools registered in toolRegistry
- [ ] Parameter schemas match implementation
- [ ] Response types match API responses

### Critical Path Coverage

- [ ] Get relationships: happy path + errors
- [ ] Create relationship: all parameter combinations
- [ ] Update relationship: additive behavior verified
- [ ] Delete relationship: all error cases

### Safety Verification

- [ ] Delete tool description starts with WARNING
- [ ] Delete tool description mentions DESTRUCTIVE
- [ ] Delete tool description lists what is deleted
- [ ] Delete tool description states data is permanent
- [ ] Delete tool description recommends confirmation

### Edge Cases

- [ ] Empty results handled
- [ ] Pagination works
- [ ] Missing optional fields handled
- [ ] API error messages preserved

## Test File Organization

```
src/__tests__/tools/
  relationships.test.ts           # All relationship tool tests
    - describe('GetRelationshipsTool')
      - describe('tool properties')
      - describe('execute - success')
      - describe('execute - errors')
      - describe('execute - edge cases')
    - describe('CreateRelationshipTool')
      - describe('tool properties')
      - describe('execute - success')
      - describe('execute - errors')
      - describe('validation')
    - describe('UpdateRelationshipTool')
      - describe('tool properties')
      - describe('execute - success')
      - describe('execute - errors')
      - describe('additive behavior')
    - describe('DeleteRelationshipTool')
      - describe('tool properties')
      - describe('tool description safety')  # CRITICAL
      - describe('execute - success')
      - describe('execute - errors')
```
