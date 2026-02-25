# Relationship Tools

## Critical: API Endpoint Pluralization

Read uses **plural**, writes use **singular**:

| Operation | Method | Path |
|-----------|--------|------|
| Get | GET | `/tables/{tableId}/relationships` |
| Create | POST | `/tables/{tableId}/relationship` |
| Update | POST | `/tables/{tableId}/relationship/{id}` |
| Delete | DELETE | `/tables/{tableId}/relationship/{id}` |

Using the wrong form returns HTTP 404. See [.claude/docs/quickbase-api-pitfalls.md](../../../.claude/docs/quickbase-api-pitfalls.md) for full context.

## Update Uses POST, Not PUT

The update endpoint uses `POST`, not `PUT` or `PATCH`. This is a Quickbase API convention for relationship mutations.
