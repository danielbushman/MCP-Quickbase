# Security Review: Relationship Management

## Security Assessment

### Authentication & Authorization

**How Auth is Handled:**

Authentication for all relationship operations flows through the existing `QuickbaseClient` which:

1. Uses `QB-USER-TOKEN` header for authentication
2. Uses `QB-Realm-Hostname` header to identify the target realm
3. Token is provided via environment variable (`QUICKBASE_USER_TOKEN`)
4. Token is never logged (redacted in all logging)

**Authorization Model:**

- Quickbase API enforces role-based permissions at the API level
- Users can only access/modify relationships in tables they have permission to
- The MCP server does not add additional authorization layers
- Permission errors (403) are passed through to the agent

**Security Considerations:**

- Token stored in environment variables (standard practice)
- No token validation performed client-side (delegated to Quickbase API)
- All authorization errors from API are surfaced clearly

### Data Protection

**Sensitive Data Handling:**

| Data Type | Protection Method |
|-----------|-------------------|
| User Token | Redacted in logs, stored in env var |
| Realm Hostname | Partially redacted in logs |
| Table IDs | Not considered sensitive, logged for debugging |
| Relationship IDs | Not considered sensitive, logged for debugging |
| Field Labels | Not considered sensitive |

**Data in Transit:**

- All API calls use HTTPS (enforced by QuickbaseClient base URL)
- TLS/SSL certificate validation handled by Node.js fetch

**Data at Rest:**

- Response caching in memory only (CacheService)
- No persistent storage of relationship data
- Cache has configurable TTL (default 3600s)

### Input Validation

**Validation Approach:**

All tools use the existing `BaseTool.validateParams()` method which:

1. Validates against JSON Schema (`paramSchema`)
2. Uses Zod for runtime type checking
3. Provides descriptive error messages

**Parameter Validation Rules:**

| Parameter | Validation | Risk if Bypassed |
|-----------|------------|------------------|
| `table_id` | Required string | API error (400) |
| `relationship_id` | Required number for update/delete | API error (400) |
| `parent_table_id` | Required string for create | API error (400) |
| `lookup_field_ids` | Optional array of numbers | API error if invalid |
| `summary_accumulation_type` | Optional string | API error if invalid |

**Injection Prevention:**

- Parameters are passed as JSON body/query params
- No string interpolation in SQL/query contexts
- Quickbase API handles all query parsing

### Known Gaps

| Gap | Risk Level | Mitigation | Status |
|-----|------------|------------|--------|
| No rate limiting beyond API defaults | Low | Quickbase API has its own rate limiting; client has 10 req/sec default | Accepted |
| Delete operation is irreversible | High | Tool description strongly warns agent; recommends user confirmation | Mitigated |
| No role-based access control in MCP server | Medium | Relies on Quickbase API permissions; MCP server is trusted middleware | Accepted |
| Cached relationship data may become stale | Low | Cache TTL limits staleness; operations can use `skipCache` | Accepted |
| No audit logging of destructive operations | Medium | Quickbase API maintains audit trail; consider future enhancement | Deferred |

## Initial Release Security Scope

### In Scope

- **Input Validation**: All parameters validated before API calls
- **Error Handling**: API errors returned without sensitive data leakage
- **Token Protection**: User token never exposed in logs or error messages
- **HTTPS Enforcement**: All API calls over TLS
- **Agent Safety**: Delete operation clearly marked as destructive

### Out of Scope (Future Phases)

- **Audit Logging**: Detailed logging of who requested what operations
- **Additional Authorization**: Role-based restrictions beyond Quickbase API
- **Dry-Run Mode**: Preview what would be deleted before actual deletion
- **Undo/Recovery**: Ability to recover deleted relationships
- **Rate Limiting UI**: Visibility into remaining API quota

## Destructive Operation Security

### Delete Relationship Risk Assessment

**Risk:** Agents may delete relationships without understanding consequences, causing permanent data loss.

**Impact:**
- All lookup fields associated with relationship are deleted
- All summary fields associated with relationship are deleted
- Data in deleted fields is permanently lost
- Cannot be recovered without Quickbase backup restore

**Mitigations Implemented:**

1. **Tool Description Warning**
   ```
   WARNING: DESTRUCTIVE OPERATION - Permanently deletes an entire
   table-to-table relationship INCLUDING ALL LOOKUP AND SUMMARY FIELDS
   associated with it. All data in those fields will be permanently
   lost and CANNOT be recovered.
   ```

2. **Guidance for Safe Usage**
   - Recommends using `get_relationships` first to review impact
   - Recommends confirming with user before proceeding
   - Suggests deleting individual fields instead if relationship should remain

3. **No Automatic Execution**
   - Agent must explicitly call the delete tool
   - Human-in-the-loop confirmation recommended in description

### Comparison with Other Delete Operations

| Operation | Destructiveness | Current Mitigation | Recommendation |
|-----------|-----------------|--------------------|--------------------|
| Delete Record | Medium | Standard tool description | None needed |
| Delete Field | High | Standard tool description | Consider adding warning |
| Delete Table | Very High | Standard tool description | Consider adding warning |
| Delete Relationship | High | WARNING in description | Implemented |
| Delete App | Critical | Standard tool description | Strongly recommend warning |

## Security Checklist

### Code Security

- [x] No hardcoded secrets (tokens from env vars)
- [x] Input validation on all external inputs (BaseTool handles)
- [x] Proper error handling without info leakage (existing pattern)
- [x] Dependencies reviewed (existing deps, no new ones)
- [x] No SQL injection vulnerabilities (N/A - JSON API)
- [x] No XSS vulnerabilities (N/A - not a web UI)

### API Security

- [x] HTTPS enforced for all API calls
- [x] Auth token properly passed in headers
- [x] Auth token never logged
- [x] API errors handled without token exposure
- [x] Rate limiting in place (client default)

### Agent Safety

- [x] Destructive operations clearly labeled
- [x] Delete tool warns about permanent data loss
- [x] Delete tool lists what will be deleted
- [x] Delete tool recommends confirmation workflow
- [x] Non-destructive tools indicate they are safe

## Security Testing Requirements

### Authentication Tests

- [ ] Verify token is not present in any log output
- [ ] Verify 401 errors are handled gracefully
- [ ] Verify 403 errors return permission-denied message

### Input Validation Tests

- [ ] Test with malformed table IDs
- [ ] Test with injection attempts in string parameters
- [ ] Test with oversized payloads

### Error Handling Tests

- [ ] Verify error messages don't contain token
- [ ] Verify error messages don't contain realm details beyond necessary
- [ ] Verify network errors don't leak internal details

### Destructive Operation Tests

- [ ] Verify delete tool description contains required warnings
- [ ] Test delete returns clear confirmation of what was deleted
- [ ] Test delete errors don't suggest partial completion without clarity

## Recommendations

### Immediate (This Release)

1. **Implement comprehensive tool descriptions** - Done in design
2. **Follow existing security patterns** - Using BaseTool, QuickbaseClient
3. **Test error handling** - Ensure no sensitive data in errors

### Future Enhancements

1. **Audit Logging**: Add structured logging for relationship operations with timestamp, user (if available), and action
2. **Dry-Run Mode**: Consider `--dry-run` or preview parameter for delete
3. **Confirmation Token**: For extra safety, require a confirmation parameter for delete operations
4. **Rate Limit Visibility**: Expose remaining API quota in responses
