# QuickBase MCP Tools Documentation

This documentation provides details on how to use the Model Context Protocol (MCP) tools for interacting with QuickBase. These tools allow you to build integrations with QuickBase applications using AI models.

## Table of Contents

- [General Concepts](#general-concepts)
  - [Authentication](#authentication)
  - [Error Handling](#error-handling)
  - [Caching](#caching)
  - [Retry Mechanisms](#retry-mechanisms)
- [Connection Tools](#connection-tools)
  - [test_connection](#test_connection)
  - [check_auth](#check_auth)
  - [configure_cache](#configure_cache)
- [App Tools](#app-tools)
  - [get_apps](#get_apps)
  - [get_app](#get_app)
  - [create_app](#create_app)
  - [update_app](#update_app)
  - [delete_app](#delete_app)
  - [copy_app](#copy_app)
- [Table Tools](#table-tools)
  - [list_tables](#list_tables)
  - [get_table](#get_table)
  - [create_table](#create_table)
  - [update_table](#update_table)
  - [delete_table](#delete_table)
- [Field Tools](#field-tools)
  - [get_table_fields](#get_table_fields)
  - [get_field](#get_field)
  - [create_field](#create_field)
  - [update_field](#update_field)
  - [delete_field](#delete_field)
- [Record Tools](#record-tools)
  - [query_records](#query_records)
  - [get_record](#get_record)
  - [create_record](#create_record)
  - [update_record](#update_record)
  - [delete_record](#delete_record)
  - [bulk_create_records](#bulk_create_records)
  - [bulk_update_records](#bulk_update_records)
  - [bulk_delete_records](#bulk_delete_records)
- [File Tools](#file-tools)
  - [upload_file](#upload_file)
  - [download_file](#download_file)
  - [delete_file](#delete_file)
- [User Tools](#user-tools)
  - [get_user](#get_user)
  - [get_current_user](#get_current_user)
  - [get_user_roles](#get_user_roles)
  - [manage_users](#manage_users)
- [Form & Dashboard Tools](#form--dashboard-tools)
  - [manage_forms](#manage_forms)
  - [manage_dashboards](#manage_dashboards)
- [Report Tools](#report-tools)
  - [run_report](#run_report)

## General Concepts

### Authentication

All QuickBase API tools require authentication. Before using any tool, you must set up your authentication credentials:

```
QB_REALM_HOSTNAME=your-realm.quickbase.com
QB_USER_TOKEN=your-user-token
```

These variables can be set in a `.env` file or directly in your environment.

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
- `bulk_delete_records`
- `get_table_records` (with pagination)

## Connection Tools

### test_connection

Tests the connection to QuickBase.

**Parameters:** None

**Returns:** Connection status

**Example:**
```json
{
  "name": "test_connection"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Connected to QuickBase successfully."
    }
  ]
}
```

### check_auth

Checks authentication status.

**Parameters:** None

**Returns:** Authentication status

**Example:**
```json
{
  "name": "check_auth"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Authentication successful. Connected to realm: your-realm.quickbase.com"
    }
  ]
}
```

### configure_cache

Configures the caching behavior.

**Parameters:**
- `enabled` (boolean, optional): Whether to enable caching (default: true)
- `clear` (boolean, optional): Whether to clear all existing caches (default: false)

**Returns:** Cache configuration status

**Example:**
```json
{
  "name": "configure_cache",
  "arguments": {
    "enabled": true,
    "clear": true
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Cache configuration updated successfully. Caching is now enabled and existing caches were cleared."
    }
  ]
}
```

## App Tools

### get_apps

Retrieves all applications the authenticated user has access to.

**Parameters:** None

**Returns:** List of applications

**Example:**
```json
{
  "name": "get_apps"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Apps Result (JSON):\n[\n  {\n    \"id\": \"bqrxzty47\",\n    \"name\": \"Project Management\",\n    \"description\": \"Track projects and tasks\",\n    \"created\": \"2023-01-15T14:30:00Z\",\n    \"updated\": \"2023-03-20T09:15:30Z\"\n  },\n  {\n    \"id\": \"bq8vjty47\",\n    \"name\": \"Inventory Tracking\",\n    \"description\": \"Manage inventory and stock levels\",\n    \"created\": \"2023-02-10T11:45:00Z\",\n    \"updated\": \"2023-03-18T16:20:45Z\"\n  }\n]"
    }
  ]
}
```

### get_app

Retrieves a specific application by ID.

**Parameters:**
- `app_id` (string, required): The ID of the application

**Returns:** Application details

**Example:**
```json
{
  "name": "get_app",
  "arguments": {
    "app_id": "bqrxzty47"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get App Result (JSON):\n{\n  \"id\": \"bqrxzty47\",\n  \"name\": \"Project Management\",\n  \"description\": \"Track projects and tasks\",\n  \"created\": \"2023-01-15T14:30:00Z\",\n  \"updated\": \"2023-03-20T09:15:30Z\",\n  \"variables\": {},\n  \"hasAdminToken\": true\n}"
    }
  ]
}
```

### create_app

Creates a new QuickBase application.

**Parameters:**
- `name` (string, required): Name for the new application
- `description` (string, optional): Description for the new application
- `options` (object, optional): Additional options for app creation

**Returns:** Created application details

**Example:**
```json
{
  "name": "create_app",
  "arguments": {
    "name": "Customer Feedback",
    "description": "Track and analyze customer feedback and suggestions"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Create App Result (JSON):\n{\n  \"id\": \"bqrxzt5wq\",\n  \"name\": \"Customer Feedback\",\n  \"description\": \"Track and analyze customer feedback and suggestions\",\n  \"created\": \"2023-03-21T14:30:00Z\",\n  \"updated\": \"2023-03-21T14:30:00Z\",\n  \"variables\": {},\n  \"hasAdminToken\": true\n}"
    }
  ]
}
```

### update_app

Updates an existing QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the application to update
- `name` (string, optional): New name for the application
- `description` (string, optional): New description for the application
- `options` (object, optional): Additional options for app update

**Returns:** Updated application details

**Example:**
```json
{
  "name": "update_app",
  "arguments": {
    "app_id": "bqrxzt5wq",
    "name": "Customer Feedback & Support",
    "description": "Track and analyze customer feedback, suggestions, and support requests"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Update App Result (JSON):\n{\n  \"id\": \"bqrxzt5wq\",\n  \"name\": \"Customer Feedback & Support\",\n  \"description\": \"Track and analyze customer feedback, suggestions, and support requests\",\n  \"created\": \"2023-03-21T14:30:00Z\",\n  \"updated\": \"2023-03-21T15:45:20Z\",\n  \"variables\": {},\n  \"hasAdminToken\": true\n}"
    }
  ]
}
```

### delete_app

Deletes a QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the application to delete

**Returns:** Deletion status

**Example:**
```json
{
  "name": "delete_app",
  "arguments": {
    "app_id": "bqrxzt5wq"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Delete App Result: Success"
    }
  ]
}
```

### copy_app

Copies a QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the source application to copy
- `name` (string, required): Name for the new application
- `description` (string, optional): Description for the new application
- `properties` (object, optional): Additional properties for the new application

**Returns:** Copied application details

**Example:**
```json
{
  "name": "copy_app",
  "arguments": {
    "app_id": "bqrxzty47",
    "name": "Project Management - Development",
    "description": "Development version of the Project Management app"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Copy App Result (JSON):\n{\n  \"id\": \"bqrxzt9yq\",\n  \"name\": \"Project Management - Development\",\n  \"description\": \"Development version of the Project Management app\",\n  \"created\": \"2023-03-21T16:30:00Z\",\n  \"updated\": \"2023-03-21T16:30:00Z\",\n  \"variables\": {},\n  \"hasAdminToken\": true\n}"
    }
  ]
}
```

## Table Tools

### list_tables

Lists all tables in the QuickBase application.

**Parameters:** None

**Returns:** List of tables

**Example:**
```json
{
  "name": "list_tables"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "List Tables Result (JSON):\n[\n  {\n    \"id\": \"bqrxzt5wq\",\n    \"name\": \"Projects\",\n    \"description\": \"List of all projects\",\n    \"appId\": \"bqrxzty47\"\n  },\n  {\n    \"id\": \"bqrxzt6wr\",\n    \"name\": \"Tasks\",\n    \"description\": \"Project tasks and assignments\",\n    \"appId\": \"bqrxzty47\"\n  }\n]"
    }
  ]
}
```

### get_table

Retrieves a specific table by ID.

**Parameters:**
- `table_id` (string, required): The ID of the table

**Returns:** Table details

**Example:**
```json
{
  "name": "get_table",
  "arguments": {
    "table_id": "bqrxzt5wq"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Table Result (JSON):\n{\n  \"id\": \"bqrxzt5wq\",\n  \"name\": \"Projects\",\n  \"description\": \"List of all projects\",\n  \"appId\": \"bqrxzty47\",\n  \"created\": \"2023-01-15T14:35:00Z\",\n  \"updated\": \"2023-03-20T09:20:30Z\"\n}"
    }
  ]
}
```

### create_table

Creates a new table in a QuickBase application.

**Parameters:**
- `app_id` (string, required): The ID of the application
- `name` (string, required): Name for the new table
- `description` (string, optional): Description for the table
- `fields` (array, optional): List of field definitions
- `options` (object, optional): Additional options for table creation

**Returns:** Created table details

**Example:**
```json
{
  "name": "create_table",
  "arguments": {
    "app_id": "bqrxzty47",
    "name": "Milestones",
    "description": "Project milestones and deadlines",
    "fields": [
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
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Create Table Result (JSON):\n{\n  \"id\": \"bqrxzt7ws\",\n  \"name\": \"Milestones\",\n  \"description\": \"Project milestones and deadlines\",\n  \"appId\": \"bqrxzty47\",\n  \"created\": \"2023-03-21T17:15:00Z\",\n  \"updated\": \"2023-03-21T17:15:00Z\"\n}"
    }
  ]
}
```

### update_table

Updates an existing QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table to update
- `name` (string, optional): New name for the table
- `description` (string, optional): New description for the table
- `options` (object, optional): Additional options for table update

**Returns:** Updated table details

**Example:**
```json
{
  "name": "update_table",
  "arguments": {
    "table_id": "bqrxzt7ws",
    "name": "Project Milestones",
    "description": "Key project milestones, deadlines, and completion dates"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Update Table Result (JSON):\n{\n  \"id\": \"bqrxzt7ws\",\n  \"name\": \"Project Milestones\",\n  \"description\": \"Key project milestones, deadlines, and completion dates\",\n  \"appId\": \"bqrxzty47\",\n  \"created\": \"2023-03-21T17:15:00Z\",\n  \"updated\": \"2023-03-21T17:30:45Z\"\n}"
    }
  ]
}
```

### delete_table

Deletes a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table to delete

**Returns:** Deletion status

**Example:**
```json
{
  "name": "delete_table",
  "arguments": {
    "table_id": "bqrxzt7ws"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Delete Table Result: Success"
    }
  ]
}
```

## Field Tools

### get_table_fields

Retrieves all fields in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table

**Returns:** List of fields

**Example:**
```json
{
  "name": "get_table_fields",
  "arguments": {
    "table_id": "bqrxzt5wq"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Table Fields Result (JSON):\n[\n  {\n    \"id\": \"1\",\n    \"fieldType\": \"recordid\",\n    \"label\": \"Record ID\",\n    \"required\": true,\n    \"unique\": true,\n    \"properties\": {}\n  },\n  {\n    \"id\": \"6\",\n    \"fieldType\": \"text\",\n    \"label\": \"Project Name\",\n    \"required\": true,\n    \"unique\": false,\n    \"properties\": {\n      \"maxLength\": 255\n    }\n  },\n  {\n    \"id\": \"7\",\n    \"fieldType\": \"text\",\n    \"label\": \"Description\",\n    \"required\": false,\n    \"unique\": false,\n    \"properties\": {\n      \"maxLength\": 1000\n    }\n  }\n]"
    }
  ]
}
```

### get_field

Retrieves a specific field in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `field_id` (string, required): The ID of the field

**Returns:** Field details

**Example:**
```json
{
  "name": "get_field",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "field_id": "6"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Field Result (JSON):\n{\n  \"id\": \"6\",\n  \"fieldType\": \"text\",\n  \"label\": \"Project Name\",\n  \"required\": true,\n  \"unique\": false,\n  \"properties\": {\n    \"maxLength\": 255\n  }\n}"
    }
  ]
}
```

### create_field

Creates a new field in a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `field_name` (string, required): Name of the field
- `field_type` (string, required): Type of the field (e.g., text, number, date)
- `options` (object, optional): Additional field options

**Returns:** Created field details

**Example:**
```json
{
  "name": "create_field",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "field_name": "Priority",
    "field_type": "text",
    "options": {
      "choices": ["Low", "Medium", "High", "Critical"],
      "defaultValue": "Medium",
      "required": true
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Create Field Result (JSON):\n{\n  \"id\": \"8\",\n  \"fieldType\": \"text\",\n  \"label\": \"Priority\",\n  \"required\": true,\n  \"unique\": false,\n  \"properties\": {\n    \"choices\": [\"Low\", \"Medium\", \"High\", \"Critical\"],\n    \"defaultValue\": \"Medium\"\n  }\n}"
    }
  ]
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

**Returns:** Updated field details

**Example:**
```json
{
  "name": "update_field",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "field_id": "8",
    "name": "Project Priority",
    "options": {
      "choices": ["Low", "Medium", "High", "Critical", "Blocker"],
      "defaultValue": "Medium",
      "required": true
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Update Field Result (JSON):\n{\n  \"id\": \"8\",\n  \"fieldType\": \"text\",\n  \"label\": \"Project Priority\",\n  \"required\": true,\n  \"unique\": false,\n  \"properties\": {\n    \"choices\": [\"Low\", \"Medium\", \"High\", \"Critical\", \"Blocker\"],\n    \"defaultValue\": \"Medium\"\n  }\n}"
    }
  ]
}
```

### delete_field

Deletes a field from a QuickBase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `field_id` (string, required): The ID of the field

**Returns:** Deletion status

**Example:**
```json
{
  "name": "delete_field",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "field_id": "8"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Delete Field Result: Success"
    }
  ]
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

**Returns:** Query results

**Example 1: Basic query**
```json
{
  "name": "query_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "where": "{6.CT.'Project'}",
    "select": ["1", "6", "7", "8"]
  }
}
```

**Example 2: Query with ordering and pagination**
```json
{
  "name": "query_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "select": ["1", "6", "7", "8"],
    "options": {
      "orderBy": [
        {"fieldId": "8", "order": "DESC"},
        {"fieldId": "6", "order": "ASC"}
      ],
      "top": 100,
      "skip": 0
    }
  }
}
```

**Example 3: Paginated query for large result sets**
```json
{
  "name": "query_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "select": ["1", "6", "7", "8"],
    "paginate": true,
    "max_records": "500"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Query Records Result (JSON):\n{\n  \"metadata\": {\n    \"totalRecords\": 3,\n    \"numRecords\": 3,\n    \"numFields\": 4,\n    \"skip\": 0\n  },\n  \"fields\": [\n    {\"id\": \"1\", \"label\": \"Record ID\", \"type\": \"recordid\"},\n    {\"id\": \"6\", \"label\": \"Project Name\", \"type\": \"text\"},\n    {\"id\": \"7\", \"label\": \"Description\", \"type\": \"text\"},\n    {\"id\": \"8\", \"label\": \"Project Priority\", \"type\": \"text\"}\n  ],\n  \"data\": [\n    {\"1\": {\"value\": 1}, \"6\": {\"value\": \"Website Redesign\"}, \"7\": {\"value\": \"Redesign company website\"}, \"8\": {\"value\": \"High\"}},\n    {\"1\": {\"value\": 2}, \"6\": {\"value\": \"Mobile App\"}, \"7\": {\"value\": \"Develop mobile application\"}, \"8\": {\"value\": \"Critical\"}},\n    {\"1\": {\"value\": 3}, \"6\": {\"value\": \"Documentation Project\"}, \"7\": {\"value\": \"Update technical documentation\"}, \"8\": {\"value\": \"Medium\"}}\n  ]\n}"
    }
  ]
}
```

### get_record

Retrieves a specific record from a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record

**Returns:** Record details

**Example:**
```json
{
  "name": "get_record",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "1"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Record Result (JSON):\n{\n  \"1\": {\"value\": 1},\n  \"6\": {\"value\": \"Website Redesign\"},\n  \"7\": {\"value\": \"Redesign company website\"},\n  \"8\": {\"value\": \"High\"}\n}"
    }
  ]
}
```

### create_record

Creates a new record in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `data` (string, required): The data for the new record in JSON format

**Returns:** Created record metadata

**Example:**
```json
{
  "name": "create_record",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "data": "{\"6\": {\"value\": \"Blog Redesign\"}, \"7\": {\"value\": \"Update company blog\"}, \"8\": {\"value\": \"Medium\"}}"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Create Record Result (JSON):\n{\n  \"metadata\": {\n    \"createdRecordIds\": [4],\n    \"lineErrors\": [],\n    \"unchangedRecordIds\": [],\n    \"totalNumberOfRecordsProcessed\": 1\n  }\n}"
    }
  ]
}
```

### update_record

Updates an existing record in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record to update
- `data` (object, required): The updated data for the record

**Returns:** Updated record metadata

**Example:**
```json
{
  "name": "update_record",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "4",
    "data": {
      "6": {"value": "Blog Redesign and Migration"},
      "8": {"value": "High"}
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Update Record Result (JSON):\n{\n  \"metadata\": {\n    \"lineErrors\": [],\n    \"unchangedRecordIds\": [],\n    \"totalNumberOfRecordsProcessed\": 1\n  }\n}"
    }
  ]
}
```

### delete_record

Deletes a record from a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record to delete

**Returns:** Deletion status

**Example:**
```json
{
  "name": "delete_record",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "4"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Delete Record Result: Success"
    }
  ]
}
```

### bulk_create_records

Creates multiple records in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `records` (array, required): Array of record data to insert

**Returns:** Created records metadata

**Example:**
```json
{
  "name": "bulk_create_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "records": [
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
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Bulk Create Records Result (JSON):\n{\n  \"metadata\": {\n    \"createdRecordIds\": [5, 6],\n    \"lineErrors\": [],\n    \"unchangedRecordIds\": [],\n    \"totalNumberOfRecordsProcessed\": 2\n  }\n}"
    }
  ]
}
```

### bulk_update_records

Updates multiple records in a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `records` (array, required): Array of record data to update (must include record IDs)

**Returns:** Updated records metadata

**Example:**
```json
{
  "name": "bulk_update_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "records": [
      {
        "3": {"value": "5"},
        "8": {"value": "Low"}
      },
      {
        "3": {"value": "6"},
        "8": {"value": "Critical"}
      }
    ]
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Bulk Update Records Result (JSON):\n{\n  \"metadata\": {\n    \"lineErrors\": [],\n    \"unchangedRecordIds\": [],\n    \"totalNumberOfRecordsProcessed\": 2\n  }\n}"
    }
  ]
}
```

### bulk_delete_records

Deletes multiple records from a Quickbase table.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_ids` (array, required): Array of record IDs to delete

**Returns:** Deletion status

**Example:**
```json
{
  "name": "bulk_delete_records",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_ids": ["5", "6"]
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Bulk Delete Records Result: Success"
    }
  ]
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

**Returns:** Upload status

**Example:**
```json
{
  "name": "upload_file",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "1",
    "field_id": "9",
    "file_path": "/path/to/document.pdf"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Upload File Result (JSON):\n{\n  \"metadata\": {\n    \"totalNumberOfFiles\": 1,\n    \"fileName\": \"document.pdf\",\n    \"fileSize\": 256000,\n    \"mimeType\": \"application/pdf\",\n    \"uploadedAt\": \"2023-03-21T18:45:30Z\"\n  }\n}"
    }
  ]
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

**Returns:** Download status

**Example:**
```json
{
  "name": "download_file",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "1",
    "field_id": "9",
    "output_path": "/downloads/document.pdf"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Download File Result: File saved to /downloads/document.pdf"
    }
  ]
}
```

### delete_file

Deletes a file from a field in a Quickbase record.

**Parameters:**
- `table_id` (string, required): The ID of the table
- `record_id` (string, required): The ID of the record
- `field_id` (string, required): The ID of the field (must be a file attachment field)
- `version` (string, optional): The version of the file to delete (default 0 for latest)

**Returns:** Deletion status

**Example:**
```json
{
  "name": "delete_file",
  "arguments": {
    "table_id": "bqrxzt5wq",
    "record_id": "1",
    "field_id": "9"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Delete File Result: Success"
    }
  ]
}
```

## User Tools

### get_user

Retrieves user information from Quickbase.

**Parameters:**
- `user_id` (string, required): The ID of the user

**Returns:** User details

**Example:**
```json
{
  "name": "get_user",
  "arguments": {
    "user_id": "57386.bhqw"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get User Result (JSON):\n{\n  \"id\": \"57386.bhqw\",\n  \"name\": \"John Smith\",\n  \"email\": \"john.smith@example.com\",\n  \"access\": \"user\"\n}"
    }
  ]
}
```

### get_current_user

Retrieves current user information from Quickbase.

**Parameters:** None

**Returns:** Current user details

**Example:**
```json
{
  "name": "get_current_user"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get Current User Result (JSON):\n{\n  \"id\": \"57386.bhqw\",\n  \"name\": \"John Smith\",\n  \"email\": \"john.smith@example.com\",\n  \"access\": \"admin\"\n}"
    }
  ]
}
```

### get_user_roles

Retrieves roles for a specific user.

**Parameters:**
- `user_id` (string, required): The ID of the user

**Returns:** User roles

**Example:**
```json
{
  "name": "get_user_roles",
  "arguments": {
    "user_id": "57386.bhqw"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Get User Roles Result (JSON):\n[\n  {\n    \"id\": \"11\",\n    \"name\": \"Administrator\",\n    \"description\": \"Full access to all applications\",\n    \"appId\": \"bqrxzty47\"\n  },\n  {\n    \"id\": \"12\",\n    \"name\": \"Developer\",\n    \"description\": \"Access to development applications\",\n    \"appId\": \"bqrxzt9yq\"\n  }\n]"
    }
  ]
}
```

### manage_users

Manages Quickbase users and their roles.

**Parameters:**
- `action` (string, required): The action to perform (add/update/remove)
- `email` (string, required): The email of the user
- `role_id` (string, required): The ID of the role to assign
- `options` (object, optional): Additional options for the action

**Returns:** Action result

**Example 1: Add a user**
```json
{
  "name": "manage_users",
  "arguments": {
    "action": "add",
    "email": "jane.doe@example.com",
    "role_id": "12",
    "options": {
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
}
```

**Example 2: Update a user's role**
```json
{
  "name": "manage_users",
  "arguments": {
    "action": "update",
    "email": "jane.doe@example.com",
    "role_id": "11"
  }
}
```

**Example 3: Remove a user**
```json
{
  "name": "manage_users",
  "arguments": {
    "action": "remove",
    "email": "jane.doe@example.com",
    "role_id": "11"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Manage Users Result: User jane.doe@example.com successfully added with role Developer"
    }
  ]
}
```

## Form & Dashboard Tools

### manage_forms

Manages Quickbase forms and their configurations.

**Parameters:**
- `action` (string, required): The action to perform (get/update)
- `table_id` (string, required): The ID of the Quickbase table
- `form_id` (string, required): The ID of the form
- `form_config` (object, optional): The form configuration (required for update)

**Returns:** Form details or update status

**Example 1: Get form configuration**
```json
{
  "name": "manage_forms",
  "arguments": {
    "action": "get",
    "table_id": "bqrxzt5wq",
    "form_id": "1"
  }
}
```

**Example 2: Update form configuration**
```json
{
  "name": "manage_forms",
  "arguments": {
    "action": "update",
    "table_id": "bqrxzt5wq",
    "form_id": "1",
    "form_config": {
      "name": "Project Entry Form",
      "description": "Form for creating new projects",
      "fields": [
        {"id": "6", "label": "Project Name", "required": true},
        {"id": "7", "label": "Description", "required": false},
        {"id": "8", "label": "Priority", "required": true}
      ]
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Manage Forms Result (JSON):\n{\n  \"id\": \"1\",\n  \"name\": \"Project Entry Form\",\n  \"description\": \"Form for creating new projects\",\n  \"tableId\": \"bqrxzt5wq\",\n  \"fields\": [\n    {\"id\": \"6\", \"label\": \"Project Name\", \"required\": true},\n    {\"id\": \"7\", \"label\": \"Description\", \"required\": false},\n    {\"id\": \"8\", \"label\": \"Priority\", \"required\": true}\n  ]\n}"
    }
  ]
}
```

### manage_dashboards

Manages Quickbase dashboards and their configurations.

**Parameters:**
- `action` (string, required): The action to perform (get/update)
- `dashboard_id` (string, required): The ID of the dashboard
- `dashboard_config` (object, optional): The dashboard configuration (required for update)
- `options` (object, optional): Additional options for the action

**Returns:** Dashboard details or update status

**Example 1: Get dashboard configuration**
```json
{
  "name": "manage_dashboards",
  "arguments": {
    "action": "get",
    "dashboard_id": "1"
  }
}
```

**Example 2: Update dashboard configuration**
```json
{
  "name": "manage_dashboards",
  "arguments": {
    "action": "update",
    "dashboard_id": "1",
    "dashboard_config": {
      "name": "Project Overview Dashboard",
      "description": "Overview of all active projects",
      "widgets": [
        {
          "type": "chart",
          "name": "Projects by Priority",
          "tableId": "bqrxzt5wq",
          "chartType": "pie",
          "groupBy": "8"
        },
        {
          "type": "report",
          "name": "Active Projects",
          "tableId": "bqrxzt5wq",
          "reportId": "1"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Manage Dashboards Result (JSON):\n{\n  \"id\": \"1\",\n  \"name\": \"Project Overview Dashboard\",\n  \"description\": \"Overview of all active projects\",\n  \"appId\": \"bqrxzty47\",\n  \"widgets\": [\n    {\n      \"type\": \"chart\",\n      \"name\": \"Projects by Priority\",\n      \"tableId\": \"bqrxzt5wq\",\n      \"chartType\": \"pie\",\n      \"groupBy\": \"8\"\n    },\n    {\n      \"type\": \"report\",\n      \"name\": \"Active Projects\",\n      \"tableId\": \"bqrxzt5wq\",\n      \"reportId\": \"1\"\n    }\n  ]\n}"
    }
  ]
}
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

**Returns:** Report results

**Example:**
```json
{
  "name": "run_report",
  "arguments": {
    "report_id": "1",
    "options": {
      "filters": {
        "8": ["High", "Critical"]
      },
      "sortBy": ["6"],
      "top": 50
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Run Report Result (JSON):\n{\n  \"metadata\": {\n    \"reportId\": \"1\",\n    \"reportName\": \"High Priority Projects\",\n    \"totalRecords\": 2,\n    \"numRecords\": 2\n  },\n  \"data\": [\n    {\"1\": {\"value\": 1}, \"6\": {\"value\": \"Website Redesign\"}, \"7\": {\"value\": \"Redesign company website\"}, \"8\": {\"value\": \"High\"}},\n    {\"1\": {\"value\": 2}, \"6\": {\"value\": \"Mobile App\"}, \"7\": {\"value\": \"Develop mobile application\"}, \"8\": {\"value\": \"Critical\"}}\n  ]\n}"
    }
  ]
}
```