# Ticket: Relationship Management

**Ticket ID:** RELS
**Status:** Planning Complete
**Created:** 2025-12-28

## Summary

Implement full support for managing table-to-table relationships in the MCP Quickbase server. This includes four tools: `get_relationships`, `create_relationship`, `update_relationship`, and `delete_relationship`. Special attention is given to tool descriptions that clearly communicate destructive behavior to AI agents, ensuring they request user confirmation before performing irreversible operations.

## Problem Statement

The MCP Quickbase server currently lacks support for managing table-to-table relationships through the Quickbase API. Relationships are fundamental to Quickbase applications, enabling linked records, lookup fields (displaying parent data in child records), and summary fields (aggregating child data in parent records). Without this capability, agents cannot:

- Explore existing table structures and data connections
- Create new relationships when building applications
- Enhance relationships with additional calculated fields
- Remove relationships when refactoring applications

## Proposed Solution

Add a new `relationships` domain to the tools directory following existing patterns. Implement four tools mapping directly to the Quickbase Relationships API:

| Tool | Operation | Safety Level |
|------|-----------|--------------|
| `get_relationships` | List all relationships for a table | Safe (read-only) |
| `create_relationship` | Create new relationship with optional lookup/summary fields | Safe (creates new) |
| `update_relationship` | Add lookup/summary fields to existing relationship | Safe (additive only) |
| `delete_relationship` | Delete entire relationship including all lookup/summary fields | **DESTRUCTIVE** |

### Key Design Decisions

1. **Agent-Safety-First Descriptions**: Tool descriptions explicitly warn about destructive operations and recommend user confirmation
2. **Flat Parameter Structure**: Simple, snake_case parameters following existing conventions
3. **Separate Domain Directory**: `src/tools/relationships/` with domain index and individual tool files

## Relevant Agents

- **ticket-planner** (planning phase) - Completed
- **task-creator** (task generation) - Next step
- **implement-feature** (implementation) - Phases 1-3
- **verify-task** (verification) - Phase 4
- **commit-task** (commit) - Phase 4

## Deliverables

### Code Deliverables

- `src/tools/relationships/index.ts` - Domain registration
- `src/tools/relationships/get_relationships.ts` - GET tool
- `src/tools/relationships/create_relationship.ts` - POST tool
- `src/tools/relationships/update_relationship.ts` - POST tool (update)
- `src/tools/relationships/delete_relationship.ts` - DELETE tool
- `src/__tests__/tools/relationships.test.ts` - Unit tests
- Updated `src/tools/index.ts` - Registration integration

### Documentation Deliverables

Planning documents in [planning/](planning/):
- Comprehensive tool descriptions with safety warnings
- API endpoint mappings
- Type definitions

## Planning Documents

- [analysis.md](planning/analysis.md) - Problem analysis, API research, success criteria
- [architecture.md](planning/architecture.md) - Solution design, component interfaces, data flow
- [plan.md](planning/plan.md) - 4-phase execution plan with agent assignments
- [quality-strategy.md](planning/quality-strategy.md) - Testing approach, coverage requirements
- [security-review.md](planning/security-review.md) - Security assessment, destructive operation safeguards

## Phase Overview

| Phase | Objective | Tools |
|-------|-----------|-------|
| 1 | Foundation & Read Operations | `get_relationships` |
| 2 | Write Operations (Non-Destructive) | `create_relationship`, `update_relationship` |
| 3 | Destructive Operations with Safety | `delete_relationship` |
| 4 | Integration & Verification | All tools tested and registered |

## Tasks

See [tasks/](tasks/) for all ticket tasks (to be created by task-creator agent).

## API Reference

**Quickbase Relationships API Endpoints:**

| Method | Endpoint | Tool |
|--------|----------|------|
| GET | `/v1/tables/{tableId}/relationships` | `get_relationships` |
| POST | `/v1/tables/{tableId}/relationships` | `create_relationship` |
| POST | `/v1/tables/{tableId}/relationships/{relationshipId}` | `update_relationship` |
| DELETE | `/v1/tables/{tableId}/relationships/{relationshipId}` | `delete_relationship` |

## Next Step

**Recommended:** Run `/sdd:review RELS` to validate planning documents before creating tasks.
