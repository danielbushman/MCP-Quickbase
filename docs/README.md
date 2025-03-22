# Quickbase MCP Integration Documentation

This directory contains documentation for the Quickbase MCP Integration.

## Contents

- **[QUICKSTART.md](QUICKSTART.md)**: A quick start guide to get up and running with the Quickbase MCP Integration
- **[QuickBase_RESTful_API_2025-03-20T15_59_54.822Z.json](QuickBase_RESTful_API_2025-03-20T15_59_54.822Z.json)**: Quickbase API documentation in OpenAPI format

## Additional Resources

- **[Project README](../README.md)**: Main project documentation
- **[CHANGELOG](../CHANGELOG.md)**: Version history and changes
- **[TEST_RESULTS](../TEST_RESULTS.md)**: Detailed test results and API compatibility information

## API Overview

The Quickbase MCP Integration provides access to the following Quickbase API endpoints:

### App Operations
- Get app information
- List available apps
- Create new applications
- Update existing applications

### Table Operations
- List tables in an application
- Get table information
- Create new tables
- Update existing tables

### Field Operations
- Get field information
- Create new fields
- Update existing fields (with limitations)

### Record Operations
- Query records with filtering and pagination
- Create new records
- Update existing records
- Bulk create/update records

### File Operations
- Upload files to record fields
- Download files from record fields

### Report Operations
- Execute Quickbase reports

## API Limitations

The Quickbase API has several limitations which have been documented in the integration:

1. **Delete Operations**: All delete operations are unsupported in the current version due to API limitations
2. **User Operations**: User management operations are unavailable due to API limitations
3. **Form & Dashboard Operations**: Form and dashboard management are unsupported due to API limitations
4. **Field Updates**: Field updates have limited functionality in the Quickbase API

## Environment Variables

The following environment variables are used to configure the integration:

```
# Required
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your_user_token_here
QUICKBASE_APP_ID=your_app_id_here

# Optional (for testing)
QUICKBASE_TABLE_ID=your_table_id_here
QUICKBASE_RECORD_ID=your_record_id_here
QUICKBASE_FILE_FIELD_ID=your_file_field_id_here
```

## Authentication

The integration uses a Quickbase User Token for authentication. To generate a token:

1. Log in to your Quickbase account
2. Go to User Settings > My User Information
3. Under User Tokens, create a new token with the necessary permissions
4. Save the token in your `.env` file