# 📋 Changelog

All notable changes to Quickbase MCP Server will be documented in this file.

## [2.1.0] - 2025-11-10

### Fixed
- **update_record**: Corrected request body structure to use proper mergeFieldId approach
- **bulk_update_records**: Fixed to include record ID in field 3 with mergeFieldId parameter
- **update_field**: Changed endpoint from path parameter to body parameters for field ID and table ID
- **update_table**: Changed HTTP method from POST to PUT as required by Quickbase API
- **update_app**: Changed HTTP method from POST to PUT and added better error handling for 401/403 responses
- **create_record**: Added support for numeric record IDs returned by API (previously only accepted strings)
- **bulk_create_records**: Added conversion of numeric record IDs to strings for consistent return types

### Added
- **delete_records**: Bulk delete records by ID array using DELETE /records endpoint
- **get_app**: Retrieve details of a specific Quickbase application
- **delete_app**: Delete a Quickbase application (with name confirmation)
- **get_table**: Retrieve details of a specific table
- **delete_table**: Delete a table from an application
- **get_field**: Retrieve details of a specific field
- **delete_fields**: Bulk delete fields by ID array
- **list_reports**: List all reports for a table
- **get_report**: Retrieve details of a specific report
- **Relationship Management** (Critical for finance module):
  - **create_relationship**: Create relationships between tables with lookup and summary fields
  - **list_relationships**: List relationships with filtering options (as parent/child)
  - **update_relationship**: Add lookup and summary fields to existing relationships
  - **delete_relationship**: Delete a relationship between tables

### Improved
- API coverage increased from 32% to approximately 65%
- Fixed all 7 previously broken tools (update operations and response parsing)
- Added 13 new operations (9 Priority 1 CRUD completions + 4 relationship operations)
- Total of 20 improvements (7 fixes + 13 new features)
- All tools now properly registered in index files and tool registry
- Better error messages with specific handling for authentication failures

## [2.0.0] - 2025-05-24

### Added
- Complete TypeScript rewrite - removed Python dependency
- Full type safety with TypeScript strict mode
- Intelligent caching system with configurable TTL
- Built-in retry logic with exponential backoff
- Rate limiting to prevent API overload
- Comprehensive error handling with structured responses
- Jest-based test suite with 45%+ coverage
- ESLint and Prettier for code quality
- MCP server implementation for both stdio and HTTP modes
- Session management and proper lifecycle handling
- Migration guide for v1 users
- Performance benchmarking tests

### Changed
- Minimum Node.js version increased to 18+ (from 14+)
- Entry point changed to `dist/mcp-stdio-server.js`
- Startup time reduced by 60% (~2s vs 5s+)
- Memory usage reduced by 40%
- All async operations now use modern async/await
- Improved validation for all tool parameters
- Better error messages with actionable context
- Reorganized project structure for better maintainability

### Fixed
- Memory leaks in long-running sessions
- Race conditions in concurrent requests
- File upload issues with large files
- Pagination bugs in query_records
- Cache invalidation timing issues
- Proper cleanup on shutdown

### Deprecated
- v1 implementation moved to v1-legacy/ for reference only

## [1.0.0] - 2025-03-21

### Added
- Added pagination support for query_records tool
- Added comprehensive test suite
- Added run_tests.sh script for easy testing
- Added TEST_RESULTS.md with detailed test results
- Added CHANGELOG.md file

### Changed
- Fixed file upload and download operations
- Improved error handling across all operations
- Updated create_record to properly format field IDs
- Updated update_record to handle JSON string parsing
- Updated documentation in README.md and tools_tested.txt

### Removed
- Removed all delete operations due to API limitations:
  - delete_app
  - delete_table
  - delete_field
  - delete_record
  - bulk_delete_records
  - delete_file
- Removed user operations due to API limitations:
  - get_user
  - get_current_user
  - get_user_roles
  - manage_users
- Removed form operations due to API limitations:
  - manage_forms
- Removed dashboard operations due to API limitations:
  - manage_dashboards

## [0.1.0] - 2025-03-20

### Added
- Initial release
- Basic MCP server implementation
- Support for Quickbase API operations
- Documentation and examples