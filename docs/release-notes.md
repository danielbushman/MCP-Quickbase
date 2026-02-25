# v2 Release Notes

## v2.3.0 - 2026-02-25

### Added
- `groupBy` parameter for `query_records` tool, enabling server-side record grouping
- Observability logging for groupBy parameter usage
- Multi-page pagination test for groupBy preservation
- Enhanced groupBy schema description with performance context

## v2.2.0 - 2025-12-29

### Added
- Relationship management tools: `get_relationships`, `create_relationship`, `update_relationship`, `delete_relationship`
- Full CRUD support for Quickbase table relationships
- Integration tests for all relationship tools

### Fixed
- API endpoint paths for relationship write operations (singular vs plural)

## v2.1.0 - 2025-12-28

### Added
- `get_field` tool for retrieving individual field details
- `delete_field` tool with system field protection and cache invalidation
- Comprehensive field tools test suite
- Future improvements documentation

### Fixed
- Pagination truncation logic preventing duplicate records
- `create_table` field mapping (use fieldHelp instead of description)
- Removed non-functional fields parameter from `create_table`
- Correct Quickbase API format for `delete_field`
- Removed unsupported `field_type` from `update_field`
- Critical security hardening for file operations
- Configuration validation and realm hostname redaction

### Changed
- Moved release notes, migration guide, and hardening summary to docs folder
- Cleaned up obsolete ai_workspace and ai_specs folders

## 🎉 Major Release: v2.0.0

This release represents a complete rewrite of Quickbase MCP Server with significant improvements in performance, reliability, and developer experience.

### 🚀 Key Improvements

#### Architecture
- **Pure TypeScript Implementation**: Removed Python dependency completely
- **Type Safety**: Full TypeScript with strict mode enabled
- **Modern Patterns**: Async/await throughout, no callbacks
- **Clean Architecture**: Layered design with clear separation of concerns

#### Performance
- **60% Faster Startup**: ~2 seconds vs 5+ seconds in v1
- **40% Less Memory**: Optimized resource usage
- **Intelligent Caching**: Configurable TTL with automatic invalidation
- **Rate Limiting**: Built-in protection against API overload

#### Reliability
- **Retry Logic**: Automatic exponential backoff for transient failures
- **Better Error Handling**: Structured errors with detailed context
- **Session Management**: Proper lifecycle management
- **Graceful Degradation**: Continues operating even with partial failures

#### Developer Experience
- **Comprehensive Types**: Full type definitions for all APIs
- **Better Testing**: Jest-based test suite with 45%+ coverage
- **ESLint + Prettier**: Consistent code formatting
- **Improved Documentation**: Clear examples and migration guide

### 📦 What's Included

#### Tools (18 at initial release, now 25 as of v2.3.0)
- **Connection**: test_connection, configure_cache
- **Apps**: create_app, update_app, list_tables
- **Tables**: create_table, update_table, get_table_fields
- **Fields**: create_field, update_field
- **Records**: query_records, create_record, update_record, bulk_create_records, bulk_update_records
- **Files**: upload_file, download_file
- **Reports**: run_report

#### Configuration
- Environment-based configuration
- Backwards compatible with v1 .env files
- New optional settings for performance tuning

### 🔄 Migration from v1

See [Migration Guide](migration-guide.md) for detailed migration instructions.

**Quick Summary**:
1. Pull latest changes
2. Run `npm install && npm run build`
3. Update Claude config path from `src/quickbase/server.js` to `dist/mcp-stdio-server.js`
4. Restart Claude Desktop

### ⚠️ Breaking Changes

- Minimum Node.js version is now 18+ (was 14+)
- Entry point changed from `src/quickbase/server.js` to `dist/mcp-stdio-server.js`
- Some internal APIs changed (but all MCP tools remain the same)

### 🐛 Bug Fixes

- Fixed memory leaks in long-running sessions
- Resolved race conditions in concurrent requests
- Fixed file upload issues with large files
- Corrected pagination bugs in query_records
- Fixed cache invalidation timing issues

### 🔮 Future Plans (as of v2.0.0)

- Increase test coverage to 80%+
- Add webhook support
- Implement streaming for large datasets
- Add more comprehensive logging options
- ~~Support for Quickbase formulas and relationships~~ (relationships added in v2.2.0)

### 📝 Notes

- All new development should use v2
- Please report any issues on GitHub

### 🙏 Acknowledgments

Thanks to all contributors and testers who helped make v2 a reality!