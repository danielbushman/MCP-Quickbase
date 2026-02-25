# Migration Guide: V1 to V2

This guide helps existing users upgrade from v1 to v2 of Quickbase MCP Server.

## 🎯 Key Benefits of V2

- **Pure TypeScript**: No Python dependencies required
- **Better Performance**: ~60% faster startup, 40% less memory usage
- **Type Safety**: Full TypeScript with strict mode
- **Improved Error Handling**: Detailed error messages with context
- **Better Testing**: More comprehensive test coverage
- **Enhanced Caching**: Intelligent caching with configurable TTL

## 📋 Pre-Migration Checklist

1. **Backup your configuration**:
   - Save your current `.env` file
   - Note your Claude Desktop configuration
   - Document any custom modifications

2. **Check Node.js version**:
   - V2 requires Node.js 18+ (v1 required 14+)
   - Run `node --version` to check

## 🚀 Migration Steps

### Step 1: Pull Latest Changes

```bash
git pull origin main
```

### Step 2: Install Dependencies

```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Install v2 dependencies
npm install

# Build the TypeScript project
npm run build
```

### Step 3: Update Configuration

1. **Environment Variables** - Your existing `.env` file is compatible! Just ensure it's in the root directory.

2. **Claude Desktop Configuration** - Update your Claude configuration file:

   **Old (v1):**
   ```json
   {
     "mcpServers": {
       "quickbase": {
         "command": "node",
         "args": ["path/to/mcp-quickbase/dist/mcp-stdio-server.js"],
         "env": {
           "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
           "QUICKBASE_USER_TOKEN": "your-token"
         }
       }
     }
   }
   ```

   **New (v2):**
   ```json
   {
     "mcpServers": {
       "quickbase": {
         "command": "node",
         "args": ["path/to/mcp-quickbase/dist/mcp-stdio-server.js"],
         "env": {
           "QUICKBASE_REALM_HOST": "your-realm.quickbase.com",
           "QUICKBASE_USER_TOKEN": "your-token"
         }
       }
     }
   }
   ```

   Note: Only the path changed from `src/quickbase/server.js` to `dist/mcp-stdio-server.js`

### Step 4: Restart Claude Desktop

After updating the configuration, restart Claude Desktop for changes to take effect.

### Step 5: Test the Connection

In Claude, test that the connector is working:

```
Can you test the Quickbase connection?
```

## 🔄 What's Changed

### Tool Names and Parameters
All tool names and parameters remain the same! Your existing prompts and workflows will continue to work.

### Performance Improvements
- Startup time reduced from 5+ seconds to ~2 seconds
- Memory usage reduced by ~40%
- Caching is now more intelligent and configurable

### Error Messages
Error messages are now more detailed and helpful, but the structure remains compatible.

### New Features in V2
- Better pagination support for large datasets
- Improved file upload/download reliability
- Enhanced bulk operations performance
- More comprehensive validation

## 🚧 Troubleshooting

### Issue: "Cannot find module" error
**Solution**: Ensure you ran `npm run build` after installing dependencies.

### Issue: Connection fails after migration
**Solution**: 
1. Check that your `.env` file is in the root directory
2. Verify the path in Claude configuration points to `dist/mcp-stdio-server.js`
3. Ensure Node.js 18+ is installed

### Issue: Python-related errors
**Solution**: V2 doesn't use Python! These errors indicate you're still using v1. Check your Claude configuration path.

### Issue: Cache behavior different
**Solution**: V2 has improved caching. You can configure it via:
```env
QUICKBASE_CACHE_ENABLED=true
QUICKBASE_CACHE_TTL=3600  # seconds
```

## 📞 Getting Help

1. Check the [README](../README.md) for updated documentation
2. Review the [Quick Start Guide](quickstart.md#-troubleshooting) for common issues
3. Open an issue on GitHub if you encounter problems

## 🔙 Rolling Back (Not Recommended)

Rolling back to v1 is no longer possible. The v1-legacy code was removed in v2.1.0. If you encounter issues, please open an issue on GitHub.

## ✅ Post-Migration Checklist

- [ ] Claude Desktop restarted
- [ ] Connection test successful
- [ ] Basic operations working (query, create, update)
- [ ] File operations tested (if used)
- [ ] Performance noticeably improved

Congratulations! You've successfully migrated to v2. Enjoy the improved performance and reliability!