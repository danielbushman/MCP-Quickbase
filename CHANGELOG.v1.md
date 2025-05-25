# 📋 Changelog

All notable changes to the Quickbase MCP Connector will be documented in this file.

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