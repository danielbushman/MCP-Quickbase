# Quickbase MCP Connector Tests

This directory contains tests for verifying the Quickbase MCP connector.

## Test Files

- **test_connection.py**: Verifies basic connectivity to the Quickbase API
- **test_file_operations.py**: Tests file upload and download operations
- **test_pagination.py**: Tests pagination functionality for query_records
- **test_remaining_operations.py**: Tests operations that need manual verification
- **validate_implementation.py**: Comprehensive validation script for the entire implementation

## Test Data Files

- **test_file.txt**: Sample file for upload/download testing
- **test_upload.txt**: Another sample file for upload testing

## Running Tests

To run the comprehensive validation script:

```bash
cd /path/to/Quickbase-MCP-connector
python tests/validate_implementation.py
```

To run individual tests:

```bash
# Test connection
python tests/test_connection.py

# Test file operations
python tests/test_file_operations.py

# Test pagination
python tests/test_pagination.py
```

## Test Environment

Tests require proper configuration in a `.env.test` file in the project root. Copy `.env.example` to `.env.test` and populate with your test credentials:

```
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here
QUICKBASE_TABLE_ID=your_table_id_here
```

Make sure the test credentials have access to a test application that can be modified without affecting production data.