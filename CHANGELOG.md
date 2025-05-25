# 📋 Changelog

All notable changes to the Quickbase MCP Connector will be documented in this file.

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