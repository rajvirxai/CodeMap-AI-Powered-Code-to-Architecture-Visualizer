/**
 * Repository Scanner Utility
 * 
 * This file contains a recursive directory scanning function that takes a directory path
 * and returns a JSON tree representing the file and folder structure. It is designed to be
 * beginner-friendly and handles folders and files separately.
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively scans a directory and builds a nested JSON structure.
 * 
 * @param {string} currentPath - The absolute path of the file or folder to scan.
 * @param {string} name - The display name of the current file or folder.
 * @param {string} relativePath - The relative path from the root.
 * @returns {object|null} The JSON tree node, or null if an error occurs.
 */
function scanDirectory(currentPath, name, relativePath = '') {
  try {
    // Get system statistics for the current path (checks if it's a directory, file size, etc.)
    const stats = fs.statSync(currentPath);

    const currentRelativePath = relativePath || name;

    // If the path points to a file, we return a simple file node
    if (!stats.isDirectory()) {
      return {
        name: name,
        type: 'file',
        fileType: path.extname(name) || 'unknown',
        path: currentRelativePath
      };
    }

    // If it's a directory, we need to scan its children
    const node = {
      name: name,
      type: 'folder',
      path: currentRelativePath,
      children: []
    };

    // Read all files/folders inside the current directory
    const files = fs.readdirSync(currentPath);

    // List of common junk folders to ignore
    const ignoredFolders = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', 'tmp', '.next', 'out'];

    for (const file of files) {
      // Skip hidden files/directories and dependency/build folders
      // to avoid bloating the output tree and to improve performance.
      if (ignoredFolders.includes(file) || file.startsWith('.')) {
        continue;
      }

      // Resolve the full absolute path of the child item
      const childPath = path.join(currentPath, file);
      const childRelativePath = relativePath ? `${relativePath}/${file}` : `${name}/${file}`;

      // Recursively scan the child item
      const childNode = scanDirectory(childPath, file, childRelativePath);

      if (childNode) {
        // Add it to the children array
        node.children.push(childNode);
      }
    }

    return node;
  } catch (error) {
    console.error(`Error scanning ${currentPath}:`, error.message);
    return null;
  }
}

module.exports = {
  scanDirectory
};
