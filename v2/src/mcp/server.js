/**
 * MCP Server implementation for Quickbase connector
 */
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Track connector status
let connectorStatus = {
  status: 'disconnected',
  error: null
};

/**
 * Check if the Python service is available
 */
function checkPythonService() {
  const pythonProcess = spawn(PYTHON_PATH, ['-c', 'print("Python working")']);
  
  return new Promise((resolve, reject) => {
    pythonProcess.on('error', (err) => {
      console.error('Python service error:', err);
      connectorStatus.status = 'error';
      connectorStatus.error = 'Python service unavailable';
      reject(err);
    });
    
    pythonProcess.stdout.on('data', (data) => {
      if(data.toString().trim() === 'Python working') {
        resolve(true);
      }
    });
    
    pythonProcess.on('close', (code) => {
      if(code !== 0) {
        connectorStatus.status = 'error';
        connectorStatus.error = `Python service exited with code ${code}`;
        reject(new Error(`Python service exited with code ${code}`));
      }
    });
  });
}

/**
 * Call Python function with arguments
 */
function callPythonFunction(modulePath, functionName, args) {
  return new Promise((resolve, reject) => {
    const script = `
import sys
import json
import traceback
sys.path.append('${path.dirname(modulePath)}')
try:
    from ${path.basename(modulePath).replace('.py', '')} import ${functionName}
    result = ${functionName}(${JSON.stringify(args)})
    print(json.dumps({"success": True, "result": result}))
except Exception as e:
    error_info = {"type": str(type(e).__name__), "message": str(e), "traceback": traceback.format_exc()}
    print(json.dumps({"success": False, "error": error_info}))
`;

    const pythonProcess = spawn(PYTHON_PATH, ['-c', script]);
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        return reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }

      try {
        const result = JSON.parse(output);
        if (result.success) {
          resolve(result.result);
        } else {
          console.error('Python function error:', result.error);
          reject(new Error(result.error.message));
        }
      } catch (err) {
        console.error('Failed to parse Python output:', err);
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });
  });
}

// MCP API routes will be implemented here

// Start server
app.listen(PORT, async () => {
  console.log(`Quickbase MCP Connector v2 server running on port ${PORT}`);
  
  try {
    await checkPythonService();
    connectorStatus.status = 'connected';
    console.log('Python service is available');
  } catch (err) {
    console.error('Failed to connect to Python service:', err);
  }
});

// Export for testing
module.exports = app;