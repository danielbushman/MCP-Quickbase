import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('FileUtil');

/**
 * Utility functions for file operations with security hardening
 */

// Maximum file size for reads (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Get the working directory (can be overridden by environment variable)
const WORKING_DIR = process.env.QUICKBASE_WORKING_DIR || process.cwd();

/**
 * Validate and sanitize a file path to prevent directory traversal
 * @param filePath The file path to validate
 * @returns Sanitized absolute path or null if invalid
 */
function sanitizePath(filePath: string): string | null {
  try {
    // Resolve to absolute path
    const absolutePath = path.resolve(WORKING_DIR, filePath);
    
    // Ensure the path is within the working directory
    const relative = path.relative(WORKING_DIR, absolutePath);
    
    // Check for directory traversal attempts
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      logger.error('Path traversal attempt detected', { 
        filePath, 
        absolutePath, 
        relative,
        workingDir: WORKING_DIR 
      });
      return null;
    }
    
    return absolutePath;
  } catch (error) {
    logger.error('Error sanitizing path', { filePath, error });
    return null;
  }
}

/**
 * Check if a file exists
 * @param filePath File path to check
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    const safePath = sanitizePath(filePath);
    if (!safePath) {
      return false;
    }
    
    return fs.existsSync(safePath) && fs.statSync(safePath).isFile();
  } catch (error) {
    logger.error('Error checking if file exists', { filePath, error });
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath Directory path to ensure
 * @returns True if the directory exists or was created
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  try {
    const safePath = sanitizePath(dirPath);
    if (!safePath) {
      return false;
    }
    
    if (fs.existsSync(safePath)) {
      return fs.statSync(safePath).isDirectory();
    }
    
    // Create the directory
    fs.mkdirSync(safePath, { recursive: true });
    return true;
  } catch (error) {
    logger.error('Error ensuring directory exists', { dirPath, error });
    return false;
  }
}

/**
 * Get information about a file
 * @param filePath File path
 * @returns File information or null if the file doesn't exist
 */
export function getFileInfo(filePath: string): { 
  name: string; 
  size: number; 
  extension: string; 
  mimeType: string; 
  lastModified: Date 
} | null {
  try {
    const safePath = sanitizePath(filePath);
    if (!safePath || !fileExists(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(safePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Simple mime type mapping
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    
    return {
      name: path.basename(filePath),
      size: stats.size,
      extension: ext,
      mimeType: mimeTypes[ext] || 'application/octet-stream',
      lastModified: stats.mtime
    };
  } catch (error) {
    logger.error('Error getting file info', { filePath, error });
    return null;
  }
}

/**
 * Read a file as a Buffer
 * @param filePath File path
 * @returns File contents as Buffer or null if an error occurs
 */
export function readFileAsBuffer(filePath: string): Buffer | null {
  try {
    const safePath = sanitizePath(filePath);
    if (!safePath) {
      logger.error('Invalid file path', { filePath });
      return null;
    }
    
    if (!fileExists(filePath)) {
      logger.error('File does not exist', { filePath });
      return null;
    }
    
    // Check file size before reading
    const stats = fs.statSync(safePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.error('File too large', { 
        filePath, 
        size: stats.size, 
        maxSize: MAX_FILE_SIZE 
      });
      return null;
    }
    
    return fs.readFileSync(safePath);
  } catch (error) {
    logger.error('Error reading file', { filePath, error });
    return null;
  }
}

/**
 * Write data to a file
 * @param filePath File path to write to
 * @param data Data to write
 * @returns True if the file was written successfully
 */
export function writeFile(filePath: string, data: Buffer | string): boolean {
  try {
    const safePath = sanitizePath(filePath);
    if (!safePath) {
      logger.error('Invalid file path', { filePath });
      return false;
    }
    
    const dirPath = path.dirname(safePath);
    const safeDirPath = sanitizePath(dirPath);
    if (!safeDirPath || !ensureDirectoryExists(safeDirPath)) {
      logger.error('Could not create directory for file', { dirPath: safeDirPath });
      return false;
    }
    
    // Check data size limit
    const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    if (dataSize > MAX_FILE_SIZE) {
      logger.error('Data too large to write', { 
        filePath, 
        size: dataSize, 
        maxSize: MAX_FILE_SIZE 
      });
      return false;
    }
    
    fs.writeFileSync(safePath, data);
    return true;
  } catch (error) {
    logger.error('Error writing file', { filePath, error });
    return false;
  }
}