# 🛠️ Available Tools

The Quickbase MCP Server provides 25 tools for Claude to interact with your Quickbase data:

## 🔗 Connection & Configuration

### `test_connection`
Verify your connection to Quickbase and check authentication.

**No parameters required**

**Example usage**: 
- "Test my Quickbase connection"
- "Check if I'm connected to Quickbase"

### `configure_cache`
Configure caching settings for improved performance.

**Parameters**:
- `enabled` (boolean, optional): Enable or disable caching
- `ttl` (number, optional): Cache time-to-live in seconds
- `clear` (boolean, optional): Clear existing cache

**Example usage**: 
- "Enable caching for Quickbase with 1 hour TTL"
- "Clear the Quickbase cache"

## 📱 Application Management

### `create_app`
Create a new Quickbase application.

**Parameters**:
- `name` (string, required): Application name
- `description` (string, optional): Application description

**Example usage**: 
- "Create a new Quickbase app called 'Project Management'"
- "Create an app named 'HR System' with description 'Employee management'"

### `update_app`
Update an existing Quickbase application.

**Parameters**:
- `app_id` (string, required): Application ID to update
- `name` (string, optional): New application name
- `description` (string, optional): New application description

**Example usage**: 
- "Update my Quickbase app description to 'Customer tracking system'"
- "Rename app bqrxzt5wq to 'Sales CRM'"

### `list_tables`
List all tables in the current Quickbase application.

**Parameters**:
- `app_id` (string, optional): Application ID (uses default if not specified)
- `include_hidden` (boolean, optional): Include hidden tables

**Example usage**: 
- "Show me all tables in my Quickbase app"
- "List all tables including hidden ones"

## 📊 Table Operations

### `create_table`
Create a new table in your Quickbase application.

**Parameters**:
- `app_id` (string, required): Application ID
- `name` (string, required): Table name
- `description` (string, optional): Table description
- `fields` (array, optional): Initial field definitions

**Example usage**: 
- "Create a new table called 'Vendors' in my app"
- "Create a 'Projects' table with Name and Status fields"

### `update_table`
Update an existing table properties.

**Parameters**:
- `table_id` (string, required): Table ID to update
- `name` (string, optional): New table name
- `description` (string, optional): New table description

**Example usage**: 
- "Update the 'Projects' table to add a description"
- "Rename table bqrxzt5wq to 'Active Projects'"

### `get_table_fields`
Retrieve all field definitions for a specific table.

**Parameters**:
- `table_id` (string, required): Table ID
- `include_system` (boolean, optional): Include system fields

**Example usage**: 
- "What fields are in the Customers table?"
- "Show me all fields in table bqrxzt5wq including system fields"

## 🏷️ Field Management

### `create_field`
Create a new field in a table.

**Parameters**:
- `table_id` (string, required): Table ID
- `field_name` (string, required): Field name/label
- `field_type` (string, required): Field type (text, number, date, etc.)
- `description` (string, optional): Field description
- `options` (object, optional): Field-specific options

**Example usage**: 
- "Add a 'Rating' field to the Customers table as a number field"
- "Create a date field called 'Due Date' in the Tasks table"

### `get_field`
Get properties of a specific field.

**Parameters**:
- `table_id` (string, required): Table ID
- `field_id` (number, required): Field ID to retrieve

**Example usage**:
- "Get the details of field 6 in the Customers table"
- "What type is field 10 in table bqrxzt5wq?"

### `update_field`
Update properties of an existing field.

**Parameters**:
- `table_id` (string, required): Table ID
- `field_id` (string, required): Field ID to update
- `name` (string, optional): New field name
- `description` (string, optional): New field description

**Example usage**:
- "Change the label of field 6 to 'Current Status'"
- "Update the description of the Priority field"

### `delete_field`
Delete a field from a table. System fields cannot be deleted.

**Parameters**:
- `table_id` (string, required): Table ID
- `field_id` (number, required): Field ID to delete

**Example usage**:
- "Delete field 15 from the Projects table"
- "Remove the unused Notes field from table bqrxzt5wq"

## 📝 Record Operations

### `query_records`
Retrieve records from a table with advanced filtering and pagination.

**Parameters**:
- `table_id` (string, required): Table ID to query
- `select` (array, optional): Field IDs to return
- `where` (string, optional): Query filter formula
- `orderBy` (array, optional): Sort criteria
- `max_records` (number, optional): Maximum records to return
- `skip` (number, optional): Records to skip (pagination)
- `paginate` (boolean, optional): Enable automatic pagination
- `groupBy` (array, optional): Group results by field(s) with sort order

**Example usage**: 
- "Show me all customer records where Status is Active"
- "Find the 10 most recent projects sorted by creation date"

### `create_record`
Create a new record in a table.

**Parameters**:
- `table_id` (string, required): Table ID
- `data` (object, required): Field data (field_id: value pairs)

**Example usage**: 
- "Create a new task with title 'Review proposal' due tomorrow"
- "Add a customer record for 'Acme Corp' with status 'Active'"

### `update_record`
Update an existing record.

**Parameters**:
- `table_id` (string, required): Table ID
- `record_id` (string, required): Record ID to update
- `data` (object, required): Updated field data

**Example usage**: 
- "Change the status of record 123 to 'Completed'"
- "Update the priority of task 456 to 'High'"

### `bulk_create_records`
Create multiple records efficiently in a single operation.

**Parameters**:
- `table_id` (string, required): Table ID
- `records` (array, required): Array of record data objects

**Example usage**: 
- "Create three new customers: Acme Inc, Widget Co, and Tech Systems"
- "Bulk import 50 new task records from this list"

### `bulk_update_records`
Update multiple records efficiently in a single operation.

**Parameters**:
- `table_id` (string, required): Table ID
- `records` (array, required): Array of record updates (must include record ID)

**Example usage**: 
- "Mark all overdue tasks as 'High Priority'"
- "Update status to 'Archived' for all completed projects"

## 📁 File Operations

### `upload_file`
Upload a file attachment to a specific record field.

**Parameters**:
- `table_id` (string, required): Table ID
- `record_id` (string, required): Record ID
- `field_id` (string, required): File field ID
- `file_path` (string, required): Local path to file
- `file_name` (string, optional): Custom filename

**Example usage**: 
- "Upload this PDF to the proposal record"
- "Attach the contract document to customer record 5678"

### `download_file`
Download a file attachment from a record field.

**Parameters**:
- `table_id` (string, required): Table ID
- `record_id` (string, required): Record ID
- `field_id` (string, required): File field ID
- `output_path` (string, required): Local path to save file
- `version` (string, optional): Specific file version

**Example usage**: 
- "Download the contract from customer record 5678"
- "Save the project document to my Downloads folder"

## 🔗 Relationship Management

### `get_relationships`
Get all relationships for a table.

**Parameters**:
- `table_id` (string, required): Table ID to get relationships for

**Example usage**:
- "Show me the relationships for the Projects table"
- "What tables are linked to the Customers table?"

### `create_relationship`
Create a new relationship between tables.

**Parameters**:
- `parent_table_id` (string, required): Parent table ID
- `child_table_id` (string, required): Child table ID
- `foreign_key_field` (object, optional): Foreign key field configuration
- `lookup_field_ids` (array, optional): Field IDs to create as lookup fields
- `summary_fields` (array, optional): Summary field configurations

**Example usage**:
- "Create a relationship from Customers to Orders"
- "Link the Projects table to the Tasks table with a lookup field"

### `update_relationship`
Update an existing relationship.

**Parameters**:
- `table_id` (string, required): Child table ID
- `relationship_id` (number, required): Relationship ID to update
- `lookup_field_ids` (array, optional): Updated lookup field IDs
- `summary_fields` (array, optional): Updated summary field configurations

**Example usage**:
- "Add a lookup field to the Projects-Tasks relationship"
- "Update the summary fields on relationship 5"

### `delete_relationship`
Delete a table relationship.

**Parameters**:
- `table_id` (string, required): Child table ID
- `relationship_id` (number, required): Relationship ID to delete

**Example usage**:
- "Delete the relationship between Projects and Tasks"
- "Remove relationship 5 from table bqrxzt5wq"

## 📊 Report Management

### `run_report`
Execute a Quickbase report and return formatted results.

**Parameters**:
- `report_id` (string, required): Report ID to execute
- `options` (object, optional): Report execution options (filters, parameters)

**Example usage**: 
- "Run my 'Monthly Sales Summary' report"
- "Execute report 123 with current month filter"
- "Run the overdue tasks report and summarize the results"

## 🔗 Chaining Tools Together

Claude can intelligently combine multiple tools for complex workflows:

**Example workflows**:
- "Find all high priority projects, create a task called 'Status update' for each one"
  - Uses: `query_records` → `bulk_create_records`

- "Export all customer data to a report and upload the summary to the management record"
  - Uses: `query_records` → `run_report` → `upload_file`

- "Create a new project table, add standard fields, and import initial data"
  - Uses: `create_table` → `create_field` (multiple) → `bulk_create_records`

## 💡 Best Practices

### For Optimal Performance:
1. **Be specific**: Use exact table and field names when known
2. **Use bulk operations**: For multiple records, use bulk tools instead of individual operations
3. **Filter wisely**: Use specific criteria to limit data retrieval
4. **Leverage caching**: Enable caching for repeated operations
5. **Paginate large datasets**: Use pagination for tables with many records

### Query Syntax Tips:
- Use Quickbase query syntax: `{field_id.operator.'value'}`
- Examples: `{6.CT.'Project'}`, `{8.GT.'2024-01-01'}`, `{10.EX.'Active'}`
- Combine conditions: `{6.CT.'Project'} AND {8.GT.'2024-01-01'}`

### Common Field Types:
- Text fields: Use `CT` (contains), `EX` (equals)
- Number fields: Use `GT` (greater than), `LT` (less than), `EQ` (equals)
- Date fields: Use date format `YYYY-MM-DD`