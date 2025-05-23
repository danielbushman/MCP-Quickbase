import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('FileUtil');

/**
 * Utility functions for file operations
 */

/**
 * Check if a file exists
 * @param filePath File path to check
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
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
    if (fs.existsSync(dirPath)) {
      return fs.statSync(dirPath).isDirectory();
    }
    
    // Create the directory
    fs.mkdirSync(dirPath, { recursive: true });
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
    if (!fileExists(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
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
    if (!fileExists(filePath)) {
      logger.error('File does not exist', { filePath });
      return null;
    }
    
    return fs.readFileSync(filePath);
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
    const dirPath = path.dirname(filePath);
    if (!ensureDirectoryExists(dirPath)) {
      logger.error('Could not create directory for file', { dirPath });
      return false;
    }
    
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    logger.error('Error writing file', { filePath, error });
    return false;
  }
}