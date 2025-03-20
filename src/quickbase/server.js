#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to the Python virtual environment
const venvPath = path.join(__dirname, '..', '..', 'venv');
const pythonPath = path.join(venvPath, 'bin', 'python');
const serverPath = path.join(__dirname, 'server.py');

// Check if virtual environment exists
if (!fs.existsSync(venvPath)) {
  console.error('Virtual environment not found. Please run setup.sh first.');
  process.exit(1);
}

// Check if Python interpreter exists
if (!fs.existsSync(pythonPath)) {
  console.error('Python interpreter not found in virtual environment.');
  process.exit(1);
}

// Check if server.py exists
if (!fs.existsSync(serverPath)) {
  console.error('server.py not found.');
  process.exit(1);
}

// Spawn the Python process with environment variables
const pythonProcess = spawn(pythonPath, [serverPath], {
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