# Claude Guidelines for Quickbase MCP Connector

## 🚀 Build/Run/Test Commands

### v2 (Current TypeScript Implementation)
```bash
# Setup and build
cd v2
npm install
npm run build

# Start servers
npm start                    # MCP stdio server  
npm run start:http          # HTTP server (debugging)

# Development mode
npm run dev                 # Auto-reload development server

# Testing
npm test                    # Run all tests
npm test -- --coverage     # Run tests with coverage
npm test -- --watch        # Watch mode for development

# Code quality
npm run lint               # ESLint
npm run format             # Prettier formatting
```

### v1 (Legacy Python Implementation - Reference Only)
```bash
# Setup (v1 legacy)
cd v1
./setup.sh

# Testing (v1 legacy)
./run_tests.sh
python tests/run_tests.py connection
python tests/run_tests.py --all
```

## 📝 Code Style

### TypeScript (v2 - Current)
- **TypeScript**: Strict type checking enabled
- **Style**: ESLint + Prettier configuration
- **Naming**: 
  - Files: kebab-case (`create-record.ts`)
  - Classes: PascalCase (`CreateRecordTool`)
  - Variables/Functions: camelCase (`executeQuery`)
  - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Imports**: Organized - local modules, then third-party, then Node.js built-ins
- **Error handling**: Structured ApiResponse objects with success/error states
- **Logging**: Centralized logger with sensitive data redaction
- **API calls**: Built-in retry logic with exponential backoff

### Python (v1 - Legacy Reference)
- **Python**: PEP 8, typed with annotations (Python 3.8+)
- **Naming**: snake_case throughout
- **Docstrings**: Triple quotes with param descriptions
- **Error handling**: try/except with specific exceptions
- **Logging**: logging_utils.py with sensitive data redaction
- **API calls**: retry.py decorator for transient errors

## 🧪 Testing

### v2 Testing Standards
- **Coverage**: Maintain >35% coverage, aim for >80%
- **Types**: Unit tests, integration tests, performance tests
- **Structure**: Tests mirror src/ directory structure
- **Mocking**: Mock external dependencies (Quickbase API)
- **Isolation**: Tests should be isolated and idempotent
- **Requirements**: New features require corresponding tests

### Test Organization
```
src/__tests__/
├── client.test.ts          # API client tests
├── cache.test.ts          # Cache service tests  
├── integration.test.ts    # Full system tests
├── performance.test.ts    # Performance benchmarks
└── tools/                # Individual tool tests
    ├── records.test.ts
    └── test_connection.test.ts
```

## 🛠️ Development Workflow

### v2 Development
1. Work in `v2/` directory (current implementation)
2. Use TypeScript with strict typing
3. Follow existing tool patterns (extend BaseTool)
4. Add comprehensive tests
5. Update documentation for public APIs
6. Run lint and tests before commits

### Tool Development Pattern
```typescript
export class MyTool extends BaseTool<MyParams, MyResult> {
  public readonly name = 'my_tool';
  public readonly description = 'Tool description';
  public readonly paramSchema = { /* JSON Schema */ };
  
  protected async run(params: MyParams): Promise<MyResult> {
    // Implementation
  }
}
```

## 🔧 Configuration

### Environment Variables
```env
QUICKBASE_REALM_HOST=your-realm.quickbase.com
QUICKBASE_USER_TOKEN=your-token
QUICKBASE_APP_ID=your-app-id
QUICKBASE_CACHE_ENABLED=true
QUICKBASE_CACHE_TTL=3600
DEBUG=false
LOG_LEVEL=INFO
```

### Claude Integration
- Main entry point: `v2/dist/mcp-stdio-server.js`
- Use absolute paths in Claude configuration
- Restart Claude after configuration changes