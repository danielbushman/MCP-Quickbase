# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-01-10

### Added - 100% Quickbase API Coverage (28 New Operations)

This major release achieves 100% coverage of the Quickbase RESTful API by implementing 28 new operations across formulas, webhooks, file management, field analytics, user management, and audit logging.

#### High-Value Features (6 operations)
- **run_formula** - Execute Quickbase formulas without storing them, perfect for testing formula logic and ad-hoc calculations
- **copy_app** - Duplicate entire applications for testing, development, or backup purposes
- **delete_file** - Complete file CRUD operations by adding file deletion capability
- **get_field_usage** - Analyze individual field usage for optimization insights
- **get_fields_usage** - Analyze all fields in a table to identify unused or low-usage fields
- **get_app_events** - List available event types for webhook configuration

#### Advanced Features - Webhooks (5 operations)
- **create_webhook** - Create event-driven webhooks for real-time notifications
- **list_webhooks** - List all configured webhooks with filtering options
- **get_webhook** - Get detailed webhook configuration and status
- **update_webhook** - Modify webhook endpoints, events, and settings
- **delete_webhook** - Remove webhooks permanently

#### Administrative Features (17 operations)

##### SCIM User Management (6 operations)
- **list_users** - List all users with pagination and filtering using SCIM 2.0
- **get_user** - Get detailed user information by ID
- **create_user** - Create new users with full profile details
- **update_user** - Update user information using PUT
- **patch_user** - Partially update users using PATCH operations
- **delete_user** - Remove users from the system

##### SCIM Group Management (5 operations)
- **list_groups** - List all groups with SCIM 2.0 support
- **get_group** - Get detailed group information and membership
- **create_group** - Create new groups with initial members
- **update_group** - Update group properties and membership
- **delete_group** - Remove groups from the system

##### User Token Management (4 operations)
- **clone_user_token** - Duplicate tokens with same permissions
- **deactivate_user_token** - Disable tokens without deleting them
- **delete_user_token** - Permanently remove tokens
- **get_temporary_token** - Obtain temporary authentication tokens

##### Audit & Compliance (1 operation)
- **get_audit_logs** - Retrieve comprehensive audit logs for security and compliance monitoring

### Technical Improvements
- Full TypeScript type safety for all new operations
- Consistent error handling across all API endpoints
- Comprehensive logging for debugging and monitoring
- Updated tool registry supporting 58 total operations
- Complete API coverage from the Quickbase RESTful API specification

### Documentation
- Updated README.md with complete tool catalog
- Added developer guide sections for new tool categories
- Comprehensive inline documentation for all new operations

### Breaking Changes
- None. This release is fully backward compatible with v2.x

### Migration Guide
No migration required. All existing tools continue to work unchanged. New operations are available immediately after upgrade.

## [2.0.5] - Previous Version
- Base implementation with 31 core operations
- Application, table, field, record, and file operations
- Report execution and relationship management

---

**Full API Coverage Achieved**: 58/58 operations (100%)
