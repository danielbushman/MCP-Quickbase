# QuickBase MCP Tools Documentation

This documentation provides details on how to use the Model Context Protocol (MCP) tools for interacting with QuickBase. These tools allow you to build integrations with QuickBase applications using AI assistants.

## Table of Contents

- [General Concepts](#general-concepts)
  - [Authentication](#authentication)
  - [Error Handling](#error-handling)
  - [Caching](#caching)
  - [Retry Mechanisms](#retry-mechanisms)
- [Connection Tools](#connection-tools)
  - [test_connection](#test_connection)
  - [configure_cache](#configure_cache)
- [App Tools](#app-tools)
  - [create_app](#create_app)
  - [update_app](#update_app)
- [Table Tools](#table-tools)
  - [list_tables](#list_tables)
  - [create_table](#create_table)
  - [update_table](#update_table)
- [Field Tools](#field-tools)
  - [get_table_fields](#get_table_fields)
  - [create_field](#create_field)
  - [update_field](#update_field)
- [Record Tools](#record-tools)
  - [query_records](#query_records)
  - [create_record](#create_record)
  - [update_record](#update_record)
  - [bulk_create_records](#bulk_create_records)
  - [bulk_update_records](#bulk_update_records)
- [File Tools](#file-tools)
  - [upload_file](#upload_file)
  - [download_file](#download_file)
- [Report Tools](#report-tools)
  - [run_report](#run_report)

## General Concepts

### Authentication

All QuickBase API tools require authentication. Before using any tool, you must set up your authentication credentials:

```bash
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your-user-token
QUICKBASE_APP_ID=your-app-id
```

These variables can be set in a `.env` file or directly in your environment via the Claude Desktop configuration.

### Error Handling

The QuickBase MCP tools use a structured error handling system with the following error types:

- `QuickbaseError`: Base exception for all QuickBase API errors
- `QuickbaseAuthError`: Authentication-related errors
- `QuickbaseRateLimitError`: API rate limit exceeded
- `QuickbaseClientError`: Client-side errors (4xx)
- `QuickbaseServerError`: Server-side errors (5xx)

Errors include:

- Message: A descriptive error message
- Status code: The HTTP status code
- Response details: The full response from the API

### Caching

The QuickBase MCP integration includes caching for improved performance. Caching is enabled by default for the following operations:

- App tables
- Table schemas
- Table fields

The cache has a default Time-To-Live (TTL) of 300 seconds (5 minutes). You can control caching behavior using the `configure_cache` tool.

### Retry Mechanisms

Many operations include automatic retry mechanisms for transient errors:

- HTTP status codes 429, 500, 502, 503, 504
- Network connectivity issues

The retry mechanism uses exponential backoff with jitter to avoid overwhelming the API. The following operations have retry logic:

- `bulk_create_records`
- `bulk_update_records`
- `query_records` (with pagination)

## Connection Tools

### test_connection

Tests the connection to QuickBase.

**Parameters:** None

**Returns:** Connection status

**Example:**
```
mcp__quickbase__test_connection
```

**Response:**
```
Connected to QuickBase successfully.
```

### configure_cache

Configures the caching behavior.

**Parameters:**
- `enabled` (boolean, optional): Whether to enable caching (default: true)
- `clear` (boolean, optional): Whether to clear all existing caches (default: false)

**Example:**
```
mcp__quickbase__configure_cache(enabled=true, clear=true)
```

**Response:**
```
Cache configuration updated successfully. Caching is now enabled and existing caches were cleared.
```

## App Tools

### create_app

Creates a new QuickBase application.

**Parameters:**
- `name` (string, required): Name for the new application
- `description` (string, optional): Description for the new application
- `options` (object, optional): Additional options for app creation

**Example:**
```
mcp__quickbase__create_app(name="Customer Feedback", description="Track and analyze customer feedback and suggestions")
```

**Response:**
```
{
  "id": "bqrxzt5wq",
  "name": "Customer Feedback",
  "description": "Track and analyze customer feedback and suggestions",
  "created": "2023-03-21T14:30:00Z",
  "updated": "2023-03-21T14:30:00Z",
  "variables": {},
  "hasAdminToken": true
}
```

### update_app

Updates an existing QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the application to update
- `name` (string, optional): New name for the application
- `description` (string, optional): New description for the application
- `options` (object, optional): Additional options for app update

**Example:**
```
mcp__quickbase__update_app(app_id="bqrxzt5wq", name="Customer Feedback & Support", description="Track and analyze customer feedback, suggestions, and support requests")
```

**Response:**
```
{
  "id": "bqrxzt5wq",
  "name": "Customer Feedback & Support",
  "description": "Track and analyze customer feedback, suggestions, and support requests",
  "created": "2023-03-21T14:30:00Z",
  "updated": "2023-03-21T15:45:20Z",
  "variables": {},
  "hasAdminToken": true
}
```

## Table Tools

### list_tables

Lists all tables in the QuickBase application.

**Parameters:** None

**Example:**
```
mcp__quickbase__list_tables()
```

**Response:**
```
[
  {
    "id": "bqrxzt5wq",
    "name": "Projects",
    "description": "List of all projects",
    "appId": "bqrxzty47"
  },
  {
    "id": "bqrxzt6wr",
    "name": "Tasks",
    "description": "Project tasks and assignments",
    "appId": "bqrxzty47"
  }
]
```

### create_table

Creates a new table in a QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the application
- `name` (string, required): Name for the new table
- `description` (string, optional): Description for the table
- `fields` (array, optional): List of field definitions
- `options` (object, optional): Additional options for table creation

**Example:**
```
mcp__quickbase__create_table(
  app_id="bqrxzty47",
  name="Milestones",
  description="Project milestones and deadlines",
  fields=[
    {
      "name": "Title",
      "type": "text"
    },
    {
      "name": "Due Date",
      "type": "date"
    },
    {
      "name": "Status",
      "type": "text"
    }
  ]
)
```

**Response:**
```
{
  "id": "bqrxzt7ws",
  "name": "Milestones",
  "description": "Project milestones and deadlines",
  "appId": "bqrxzty47",
  "created": "2023-03-21T17:15:00Z",
  "updated": "2023-03-21T17:15:00Z"
}
```

### update_table

Updates an existing QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table to update
- `name` (string, optional): New name for the table
- `description` (string, optional): New description for the table
- `options` (object, optional): Additional options for table update

**Example:**
```
mcp__quickbase__update_table(
  table_id="bqrxzt7ws",
  name="Project Milestones",
  description="Key project milestones, deadlines, and completion dates"
)
```

**Response:**
```
{
  "id": "bqrxzt7ws",
  "name": "Project Milestones",
  "description": "Key project milestones, deadlines, and completion dates",
  "appId": "bqrxzty47",
  "created": "2023-03-21T17:15:00Z",
  "updated": "2023-03-21T17:30:45Z"
}
```

## Field Tools

### get_table_fields

Retrieves all fields in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table

**Example:**
```
mcp__quickbase__get_table_fields(table_id="bqrxzt5wq")
```

**Response:**
```
[
  {
    "id": "1",
    "fieldType": "recordid",
    "label": "Record ID",
    "required": true,
    "unique": true,
    "properties": {}
  },
  {
    "id": "6",
    "fieldType": "text",
    "label": "Project Name",
    "required": true,
    "unique": false,
    "properties": {
      "maxLength": 255
    }
  },
  {
    "id": "7",
    "fieldType": "text",
    "label": "Description",
    "required": false,
    "unique": false,
    "properties": {
      "maxLength": 1000
    }
  }
]
```

### create_field

Creates a new field in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `field_name` (string, required): Name of the field
- `field_type` (string, required): Type of the field (e.g., text, number, date)
- `options` (object, optional): Additional field options

**Example:**
```
mcp__quickbase__create_field(
  table_id="bqrxzt5wq",
  field_name="Priority",
  field_type="text",
  options={
    "choices": ["Low", "Medium", "High", "Critical"],
    "defaultValue": "Medium",
    "required": true
  }
)
```

**Response:**
```
{
  "id": "8",
  "fieldType": "text",
  "label": "Priority",
  "required": true,
  "unique": false,
  "properties": {
    "choices": ["Low", "Medium", "High", "Critical"],
    "defaultValue": "Medium"
  }
}
```

### update_field

Updates an existing field in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `field_id` (string, required): The ID of the field
- `name` (string, optional): New name for the field
- `field_type` (string, optional): New type for the field
- `options` (object, optional): Additional field options

**Example:**
```
mcp__quickbase__update_field(
  table_id="bqrxzt5wq",
  field_id="8",
  name="Project Priority",
  options={
    "choices": ["Low", "Medium", "High", "Critical", "Blocker"],
    "defaultValue": "Medium",
    "required": true
  }
)
```

**Response:**
```
{
  "id": "8",
  "fieldType": "text",
  "label": "Project Priority",
  "required": true,
  "unique": false,
  "properties": {
    "choices": ["Low", "Medium", "High", "Critical", "Blocker"],
    "defaultValue": "Medium"
  }
}
```

## Record Tools

### query_records

Executes a query against a Quickbase table with optional pagination.

**Parameters:**
- `table_id` (string, required): The ID of the Quickbase table
- `where` (string, optional): Query criteria using QuickBase query syntax
- `select` (array, optional): Fields to select (field IDs)
- `options` (object, optional): Query options for filtering, ordering, and pagination
  - `orderBy` (array, optional): Fields to order results by
  - `groupBy` (array, optional): Fields to group results by
  - `top` (integer, optional): Number of records to retrieve per page
  - `skip` (integer, optional): Number of records to skip
- `paginate` (boolean, optional): Whether to automatically handle pagination for large result sets
- `max_records` (string, optional): Maximum number of records to return when paginating (default: 1000)

**Example 1: Basic query**
```
mcp__quickbase__query_records(
  table_id="bqrxzt5wq",
  where="{6.CT.'Project'}",
  select=["1", "6", "7", "8"]
)
```

**Example 2: Query with ordering and pagination**
```
mcp__quickbase__query_records(
  table_id="bqrxzt5wq",
  select=["1", "6", "7", "8"],
  options={
    "orderBy": [
      {"fieldId": "8", "order": "DESC"},
      {"fieldId": "6", "order": "ASC"}
    ],
    "top": 100,
    "skip": 0
  }
)
```

**Example 3: Paginated query for large result sets**
```
mcp__quickbase__query_records(
  table_id="bqrxzt5wq",
  select=["1", "6", "7", "8"],
  paginate=true,
  max_records="500"
)
```

**Response:**
```
{
  "metadata": {
    "totalRecords": 3,
    "numRecords": 3,
    "numFields": 4,
    "skip": 0
  },
  "fields": [
    {"id": "1", "label": "Record ID", "type": "recordid"},
    {"id": "6", "label": "Project Name", "type": "text"},
    {"id": "7", "label": "Description", "type": "text"},
    {"id": "8", "label": "Project Priority", "type": "text"}
  ],
  "data": [
    {"1": {"value": 1}, "6": {"value": "Website Redesign"}, "7": {"value": "Redesign company website"}, "8": {"value": "High"}},
    {"1": {"value": 2}, "6": {"value": "Mobile App"}, "7": {"value": "Develop mobile application"}, "8": {"value": "Critical"}},
    {"1": {"value": 3}, "6": {"value": "Documentation Project"}, "7": {"value": "Update technical documentation"}, "8": {"value": "Medium"}}
  ]
}
```

### create_record

Creates a new record in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `data` (string, required): The data for the new record in JSON format

**Example:**
```
mcp__quickbase__create_record(
  table_id="bqrxzt5wq",
  data="{\"6\": {\"value\": \"Blog Redesign\"}, \"7\": {\"value\": \"Update company blog\"}, \"8\": {\"value\": \"Medium\"}}"
)
```

**Response:**
```
{
  "metadata": {
    "createdRecordIds": [4],
    "lineErrors": [],
    "unchangedRecordIds": [],
    "totalNumberOfRecordsProcessed": 1
  }
}
```

### update_record

Updates an existing record in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record to update
- `data` (object, required): The updated data for the record

**Example:**
```
mcp__quickbase__update_record(
  table_id="bqrxzt5wq",
  record_id="4",
  data={
    "6": {"value": "Blog Redesign and Migration"},
    "8": {"value": "High"}
  }
)
```

**Response:**
```
{
  "metadata": {
    "lineErrors": [],
    "unchangedRecordIds": [],
    "totalNumberOfRecordsProcessed": 1
  }
}
```

### bulk_create_records

Creates multiple records in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `records` (array, required): Array of record data to insert

**Example:**
```
mcp__quickbase__bulk_create_records(
  table_id="bqrxzt5wq",
  records=[
    {
      "6": {"value": "Email Campaign"},
      "7": {"value": "Email marketing campaign"},
      "8": {"value": "Medium"}
    },
    {
      "6": {"value": "CRM Integration"},
      "7": {"value": "Integrate with CRM system"},
      "8": {"value": "High"}
    }
  ]
)
```

**Response:**
```
{
  "metadata": {
    "createdRecordIds": [5, 6],
    "lineErrors": [],
    "unchangedRecordIds": [],
    "totalNumberOfRecordsProcessed": 2
  }
}
```

### bulk_update_records

Updates multiple records in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `records` (array, required): Array of record data to update (must include record IDs)

**Example:**
```
mcp__quickbase__bulk_update_records(
  table_id="bqrxzt5wq",
  records=[
    {
      "3": {"value": "5"},
      "8": {"value": "Low"}
    },
    {
      "3": {"value": "6"},
      "8": {"value": "Critical"}
    }
  ]
)
```

**Response:**
```
{
  "metadata": {
    "lineErrors": [],
    "unchangedRecordIds": [],
    "totalNumberOfRecordsProcessed": 2
  }
}
```

## File Tools

### upload_file

Uploads a file to a field in a Quickbase record.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record
- `field_id` (string, required): The ID of the field (must be a file attachment field)
- `file_path` (string, required): Path to the file to upload

**Example:**
```
mcp__quickbase__upload_file(
  table_id="bqrxzt5wq",
  record_id="1",
  field_id="9",
  file_path="/path/to/document.pdf"
)
```

**Response:**
```
{
  "metadata": {
    "totalNumberOfFiles": 1,
    "fileName": "document.pdf",
    "fileSize": 256000,
    "mimeType": "application/pdf",
    "uploadedAt": "2023-03-21T18:45:30Z"
  }
}
```

### download_file

Downloads a file from a field in a Quickbase record.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record
- `field_id` (string, required): The ID of the field (must be a file attachment field)
- `output_path` (string, required): Path where the file should be saved
- `version` (string, optional): The version of the file to download (default 0 for latest)

**Example:**
```
mcp__quickbase__download_file(
  table_id="bqrxzt5wq",
  record_id="1",
  field_id="9",
  output_path="/downloads/document.pdf"
)
```

**Response:**
```
File saved to /downloads/document.pdf
```

## Report Tools

### run_report

Executes a Quickbase report.

**Parameters:**
- `report_id` (string, required): The ID of the report to run
- `options` (object, optional): Additional options for the report
  - `filters` (object, optional): Filter conditions for the report
  - `format` (string, optional): Output format for the report
  - `groupBy` (array, optional): Fields to group results by
  - `sortBy` (array, optional): Fields to sort results by
  - `skip` (integer, optional): Number of records to skip
  - `top` (integer, optional): Number of records to retrieve

**Example:**
```
mcp__quickbase__run_report(
  report_id="1",
  options={
    "filters": {
      "8": ["High", "Critical"]
    },
    "sortBy": ["6"],
    "top": 50
  }
)
```

**Response:**
```
{
  "metadata": {
    "reportId": "1",
    "reportName": "High Priority Projects",
    "totalRecords": 2,
    "numRecords": 2
  },
  "data": [
    {"1": {"value": 1}, "6": {"value": "Website Redesign"}, "7": {"value": "Redesign company website"}, "8": {"value": "High"}},
    {"1": {"value": 2}, "6": {"value": "Mobile App"}, "7": {"value": "Develop mobile application"}, "8": {"value": "Critical"}}
  ]
}
```