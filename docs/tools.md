# Available Tools

The Quickbase Connector provides the following tools for Claude to interact with your Quickbase data:

## Connection Tools

### `test_connection`
Verify your connection to Quickbase.

**Example**: "Test my Quickbase connection"

### `configure_cache`
Configure caching settings for better performance.

**Example**: "Turn on caching for the Quickbase connector"

## App Management

### `create_app`
Create a new Quickbase application.

**Example**: "Create a new Quickbase app called 'Project Management'"

### `update_app`
Update an existing Quickbase application.

**Example**: "Update my Quickbase app description to 'Customer tracking system'"

### `list_tables`
List all tables in the current Quickbase application.

**Example**: "Show me all tables in my Quickbase app"

## Table Operations

### `create_table`
Create a new table in your Quickbase application.

**Example**: "Create a new table called 'Vendors' in my app"

### `update_table`
Update an existing table.

**Example**: "Update the 'Projects' table to add a description"

### `get_table_fields`
List all fields in a specific table.

**Example**: "What fields are in the Customers table?"

## Field Management

### `create_field`
Create a new field in a table.

**Example**: "Add a 'Rating' field to the Customers table as a number field"

### `update_field`
Update an existing field.

**Example**: "Change the label of the 'Status' field to 'Current Status'"

## Record Operations

### `query_records`
Retrieve records from a table, with optional filtering.

**Example**: "Show me all customer records where Status is Active"

### `create_record`
Create a new record in a table.

**Example**: "Create a new task with title 'Review proposal' due tomorrow"

### `update_record`
Update an existing record.

**Example**: "Change the status of task 1234 to 'Completed'"

### `bulk_create_records`
Create multiple records at once.

**Example**: "Create three new customers: Acme Inc, Widget Co, and Tech Systems"

### `bulk_update_records`
Update multiple records at once.

**Example**: "Mark all overdue tasks as 'High Priority'"

## File Operations

### `upload_file`
Upload a file to a specific record.

**Example**: "Upload this PDF to the proposal record"

### `download_file`
Download a file from a record.

**Example**: "Download the contract from customer record 5678"

## Report Management

### `run_report`
Execute a Quickbase report and return the results.

**Example**: "Run my 'Monthly Sales Summary' report"

## Using Multiple Tools Together

Claude can chain tools together to perform complex operations:

**Example**: "Find all high priority projects, create a task called 'Status update' for each one, and assign it to John"

This would use:
1. `query_records` to find the projects
2. `bulk_create_records` to create the tasks

## Best Practices

For best results when working with the Quickbase Connector:

1. Be specific about table and field names
2. For complex operations, break them into steps
3. When filtering records, use clear criteria
4. Specify page size for large data sets