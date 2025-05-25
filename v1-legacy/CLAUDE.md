# Claude Guidelines for Quickbase-MCP-connector

## Build/Run/Test Commands
- Setup: `./setup.sh` - Install dependencies
- Start server: `npm start` or `node src/quickbase/server.js`
- Run all tests: `./run_tests.sh` 
- Run specific test: `python tests/run_tests.py connection` (options: connection, file, pagination, validate, remaining, create, table, app)
- Run all tests with details: `python tests/run_tests.py --all`

## Code Style
- Python: PEP 8, typed with annotations (Python 3.8+)
- JavaScript: Node.js standard style (Node 14+)
- Docstrings: Use triple quotes with param descriptions
- Error handling: Use try/except with specific exceptions
- Logging: Use logging_utils.py for API logging with sensitive data redaction
- Imports: Standard library first, then third-party, then local modules
- Naming: snake_case for Python, camelCase for JavaScript
- API calls: Use retry.py decorator for handling transient errors

## Testing
- New features require corresponding tests
- Tests should be isolated and idempotent
- Include proper error handling and validation in tests