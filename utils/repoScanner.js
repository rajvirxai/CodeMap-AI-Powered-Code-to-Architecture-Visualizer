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
 * @returns {object} The JSON tree node.
 */
function scanDirectory(currentPath, name) {
  // Get system statistics for the current path (checks if it's a directory, file size, etc.)
  const stats = fs.statSync(currentPath);

  // If the path points to a file, we return a simple file node
  if (!stats.isDirectory()) {
    return {
      name: name,
      type: 'file'
    };
  }

  // If it's a directory, we need to scan its children
  const node = {
    name: name,
    type: 'folder',
    children: []
  };

  // Read all files/folders inside the current directory
  const files = fs.readdirSync(currentPath);

  for (const file of files) {
    // Skip hidden files/directories (like .git, .vscode, .gitignore) and dependency folders (node_modules)
    // to avoid bloating the output tree and to improve performance.
    if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
      continue;
    }

    // Resolve the full absolute path of the child item
    const childPath = path.join(currentPath, file);

    // Recursively scan the child item
    const childNode = scanDirectory(childPath, file);

    // Add it to the children array
    node.children.push(childNode);
  }

  return node;
}

module.exports = {
  scanDirectory
};
