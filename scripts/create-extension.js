#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Recursively add files from directory to JSZip
function addDirectoryToZip(zip, dirPath, basePath = '') {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const relativePath = basePath ? join(basePath, file) : file;
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      addDirectoryToZip(zip, filePath, relativePath);
    } else {
      const fileContent = readFileSync(filePath);
      zip.file(relativePath, fileContent);
    }
  }
}

// Create zip file from dist folder
async function createZip(version) {
  const distPath = resolve(rootDir, 'dist');
  const releasesDir = resolve(rootDir, 'releases');
  const zipFilename = `qoqolo-photo-downloader-chrome-extension-v${version.replace(/\./g, '_')}.zip`;
  const zipPath = resolve(releasesDir, zipFilename);

  if (!existsSync(distPath)) {
    throw new Error('dist folder does not exist. Please run pnpm build first.');
  }

  // Create releases directory if it doesn't exist
  if (!existsSync(releasesDir)) {
    mkdirSync(releasesDir, { recursive: true });
    console.log(`\n✓ Created releases directory`);
  }

  // Create JSZip instance
  const zip = new JSZip();

  // Add all files from dist directory
  console.log('  Adding files to zip...');
  addDirectoryToZip(zip, distPath);

  // Generate zip file
  console.log('  Generating zip file...');
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }, // Maximum compression
  });

  // Write to file
  writeFileSync(zipPath, zipBuffer);

  const sizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Created extension zip: ${zipFilename}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`  Location: ${zipPath}`);

  return zipPath;
}

// Main function
async function main() {
  console.log('📦 Creating extension zip file...\n');

  try {
    // Read current version from package.json
    const packagePath = resolve(rootDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const version = packageJson.version;

    console.log(`✓ Current version: ${version}`);

    // Step 1: Build
    console.log('\n✓ Running pnpm build...');
    execSync('pnpm build', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('\n✓ Build completed successfully');

    // Step 2: Create zip
    console.log('\n✓ Creating zip file...');
    await createZip(version);

    console.log('\n🎉 Extension zip created successfully!');
  } catch (error) {
    console.error('\n✗ Failed to create extension zip:', error.message);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('\n✗ Unexpected error:', error);
  process.exit(1);
});

