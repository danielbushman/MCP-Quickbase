#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to the Python virtual environment
const venvPath = path.join(__dirname, '..', '..', 'venv');
const pythonPath = path.join(venvPath, 'bin', 'python');
const systemPythonPath = '/usr/bin/python'; // Fallback to system Python
const serverPath = path.join(__dirname, 'server.py');

// Check if virtual environment exists
if (!fs.existsSync(venvPath)) {
  console.log('Virtual environment not found. Using system Python instead.');
}

// Select Python interpreter - try virtual environment first, then fall back to system Python
let selectedPythonPath = pythonPath;
if (!fs.existsSync(pythonPath)) {
  console.log('Python interpreter not found in virtual environment. Using system Python instead.');
  selectedPythonPath = systemPythonPath;
  
  // Check if system Python exists
  if (!fs.existsSync(systemPythonPath)) {
    console.error('System Python interpreter not found. Please ensure Python is installed.');
    process.exit(1);
  }
}

// Check if server.py exists
if (!fs.existsSync(serverPath)) {
  console.error('server.py not found.');
  process.exit(1);
}

// Spawn the Python process with environment variables
const pythonProcess = spawn(selectedPythonPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env // Pass through all environment variables
});

// Forward stdout and stderr
pythonProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

pythonProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process exit
pythonProcess.on('close', (code) => {
  process.exit(code);
});

// Forward stdin
process.stdin.pipe(pythonProcess.stdin);