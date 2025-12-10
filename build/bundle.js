#!/usr/bin/env node

/**
 * Simple MCPB bundle creator
 * Creates a .mcpb file (which is a ZIP archive) from the build directory
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE_ROOT = path.dirname(__dirname);
const SOURCE_ROOT = path.join(BUNDLE_ROOT, 'awesome-copilot');

// Create output stream
const outputPath = path.join(BUNDLE_ROOT, 'awesome-copilot-1.0.0.mcpb');
const output = fs.createWriteStream(outputPath);

// Create archiver instance
const archive = archiver('zip', {
  zlib: { level: 9 }
});

// Listen for all archive data to be written
output.on('close', () => {
  console.log(`✓ Bundle created successfully!`);
  console.log(`  File: ${outputPath}`);
  console.log(`  Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nBundle ready for distribution!');
  console.log('\nInstallation instructions:');
  console.log('  Windows: Copy to $env:APPDATA\\Claude\\mcpb\\');
  console.log('  macOS/Linux: cp to ~/Library/Application\\ Support/Claude/mcpb/');
});

// Good practice to catch warnings
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Catch errors
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add build directory
console.log('Creating bundle...');
archive.directory(path.join(BUNDLE_ROOT, 'build'), 'build');
const addDirectoryIfExists = (src, dest) => {
  if (fs.existsSync(src)) {
    archive.directory(src, dest);
  } else {
    console.warn(`Skipping missing directory: ${src}`);
  }
};

addDirectoryIfExists(path.join(SOURCE_ROOT, 'instructions'), 'instructions');
addDirectoryIfExists(path.join(SOURCE_ROOT, 'prompts'), 'prompts');
addDirectoryIfExists(path.join(SOURCE_ROOT, 'collections'), 'collections');
addDirectoryIfExists(path.join(SOURCE_ROOT, 'agents'), 'agents');
archive.file(path.join(BUNDLE_ROOT, 'readme.md'), { name: 'README.md' });

// Finalize the archive
archive.finalize();
