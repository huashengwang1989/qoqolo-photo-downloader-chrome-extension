#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const RELEASE_BRANCH = 'release';
const MAIN_BRANCHES = ['main', 'master'];

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

// Helper to run git commands
function git(command, options = {}) {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf8',
      cwd: rootDir,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    }).trim();
  } catch (error) {
    if (options.silent && error.status === 1) {
      return '';
    }
    throw error;
  }
}

// Get current branch
function getCurrentBranch() {
  return git('rev-parse --abbrev-ref HEAD', { silent: true });
}

// Check if there are uncommitted changes
function hasUncommittedChanges() {
  const status = git('status --porcelain', { silent: true });
  return status.length > 0;
}

// Check if branch is ahead of origin
function isAheadOfOrigin(branch) {
  git('fetch origin', { silent: true });
  const ahead = git(`rev-list --count ${branch}..origin/${branch}`, { silent: true });
  return parseInt(ahead, 10) > 0;
}

// Check if branch exists locally
function branchExists(branch) {
  const branches = git('branch --list', { silent: true });
  return branches.includes(branch);
}

// Check if branch exists on remote
function remoteBranchExists(branch) {
  git('fetch origin', { silent: true });
  const branches = git('branch -r --list', { silent: true });
  return branches.includes(`origin/${branch}`);
}

// Create or checkout release branch
function ensureReleaseBranch(mainBranch) {
  if (branchExists(RELEASE_BRANCH)) {
    console.log(`\n✓ Release branch '${RELEASE_BRANCH}' exists locally`);
    git(`checkout ${RELEASE_BRANCH}`);
    // If release branch exists on remote, pull latest
    if (remoteBranchExists(RELEASE_BRANCH)) {
      console.log(`\n✓ Pulling latest ${RELEASE_BRANCH} from origin...`);
      git(`pull origin ${RELEASE_BRANCH}`);
    }
  } else {
    // Check if release branch exists on remote
    if (remoteBranchExists(RELEASE_BRANCH)) {
      console.log(`\n✓ Release branch '${RELEASE_BRANCH}' exists on remote. Checking out...`);
      git(`checkout -b ${RELEASE_BRANCH} origin/${RELEASE_BRANCH}`);
    } else {
      console.log(`\n✓ Creating release branch '${RELEASE_BRANCH}' from ${mainBranch}`);
      git(`checkout -b ${RELEASE_BRANCH} ${mainBranch}`);
    }
  }
}

// Merge main/master into release branch
function mergeMainIntoRelease(mainBranch) {
  console.log(`\n✓ Merging ${mainBranch} into ${RELEASE_BRANCH}...`);
  try {
    git(`merge ${mainBranch} --no-edit`);
  } catch (error) {
    console.error(`\n✗ Failed to merge ${mainBranch} into ${RELEASE_BRANCH}`);
    console.error('Please resolve conflicts manually and try again.');
    throw error;
  }
}

// Update package.json version
function updatePackageVersion(newVersion) {
  const packagePath = resolve(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`\n✓ Updated package.json version to ${newVersion}`);
}

// Update CHANGELOG.md with new version
function updateChangelog(newVersion) {
  const changelogPath = resolve(rootDir, 'CHANGELOG.md');

  if (!existsSync(changelogPath)) {
    console.warn('\n⚠️  CHANGELOG.md not found. Skipping changelog update.');
    return;
  }

  const changelogContent = readFileSync(changelogPath, 'utf8');

  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Check if there's an "Unreleased" section
  const unreleasedPattern = /^## \[Unreleased\]/m;

  let newChangelogContent;

  if (unreleasedPattern.test(changelogContent)) {
    // Replace [Unreleased] with the new version and date
    newChangelogContent = changelogContent.replace(
      /^## \[Unreleased\]/m,
      `## [${newVersion}] - ${dateStr}`,
    );
  } else {
    // Find the first version section (after header) and insert new version before it
    // Look for the first "## [" that's not part of the header
    const lines = changelogContent.split('\n');
    let insertIndex = -1;

    // Find where to insert (after header, before first version)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^## \[/)) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      // No version section found, append after header
      insertIndex = lines.findIndex((line) => line.trim() === '') + 1;
      if (insertIndex === 0) {
        insertIndex = lines.length;
      }
    }

    // Insert new version section
    const newSection = [
      `## [${newVersion}] - ${dateStr}`,
      '',
      '### Added',
      '',
      '- (Add your changes here)',
      '',
    ];
    lines.splice(insertIndex, 0, ...newSection);
    newChangelogContent = lines.join('\n');
  }

  writeFileSync(changelogPath, newChangelogContent);
  console.log(`\n✓ Updated CHANGELOG.md with version ${newVersion}`);
}

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
  console.log(`\n✓ Created release zip: ${zipFilename}`);
  console.log(`  Size: ${sizeMB} MB`);

  return zipPath;
}

// Parse version and increment
function incrementVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

// Prompt user for input
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

// Main release process
async function main() {
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be committed or pushed\n');
  }
  console.log('🚀 Starting release process...\n');

  // Step 1: Check current branch
  const currentBranch = getCurrentBranch();
  const isMainBranch = MAIN_BRANCHES.includes(currentBranch);

  if (!isMainBranch) {
    console.error(`✗ Error: Must be on main or master branch. Current branch: ${currentBranch}`);
    process.exit(1);
  }

  console.log(`✓ Current branch: ${currentBranch}`);

  // Step 2: Check for uncommitted changes
  if (hasUncommittedChanges()) {
    console.error('\n✗ Error: You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  console.log('✓ No uncommitted changes');

  // Step 3: Read current version
  const packagePath = resolve(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`✓ Current version: ${currentVersion}`);

  // Step 4: Ask for version bump type
  console.log('\nVersion bump type:');
  console.log('  1. major (x.0.0) - Breaking changes');
  console.log('  2. minor (x.y.0) - New features');
  console.log('  3. patch (x.y.z) - Bug fixes');
  const bumpType = await prompt('\nSelect version bump type (1/2/3): ');

  let versionType;
  switch (bumpType) {
    case '1':
      versionType = 'major';
      break;
    case '2':
      versionType = 'minor';
      break;
    case '3':
      versionType = 'patch';
      break;
    default:
      console.error('\n✗ Invalid selection. Please choose 1, 2, or 3.');
      process.exit(1);
  }

  // Step 5: Calculate new version
  const newVersion = incrementVersion(currentVersion, versionType);
  console.log(`\n📦 Version bump: ${currentVersion} → ${newVersion}`);

  // Step 5.5: Remind user to update changelog
  const changelogUpdated = await prompt(
    '\nHave you updated Changelog? If not, please update at "[Unreleased]" section (yes/no): ',
  );
  if (changelogUpdated.toLowerCase() !== 'yes' && changelogUpdated.toLowerCase() !== 'y') {
    console.log('\n✗ Please update the changelog at "[Unreleased]" section before releasing.');
    console.log('  Release cancelled.');
    process.exit(0);
  }

  // Step 6: Confirm version
  const confirm = await prompt('\nProceed with this version? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\n✗ Release cancelled.');
    process.exit(0);
  }

  try {
    // Step 7: Push main/master to origin if ahead
    if (isAheadOfOrigin(currentBranch)) {
      if (isDryRun) {
        console.log(`\n[DRY RUN] Would push ${currentBranch} to origin`);
      } else {
        console.log(`\n✓ ${currentBranch} is ahead of origin. Pushing...`);
        git(`push origin ${currentBranch}`);
      }
    } else {
      console.log(`\n✓ ${currentBranch} is up to date with origin`);
    }

    // Step 8: Ensure release branch exists and switch to it
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would ensure release branch exists and switch to it`);
    } else {
      ensureReleaseBranch(currentBranch);
    }

    // Step 9: Merge main/master into release
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would merge ${currentBranch} into ${RELEASE_BRANCH}`);
    } else {
      mergeMainIntoRelease(currentBranch);
    }

    // Step 10: Update package.json version
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would update package.json version to ${newVersion}`);
    } else {
      updatePackageVersion(newVersion);
    }

    // Step 10.5: Update CHANGELOG.md
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would update CHANGELOG.md with version ${newVersion}`);
    } else {
      updateChangelog(newVersion);
    }

    // Step 11: Commit version update
    const tagName = `v${newVersion}`;
    if (isDryRun) {
      console.log(
        `\n[DRY RUN] Would commit package.json and CHANGELOG.md with message: "release: bump version to ${newVersion}"`,
      );
    } else {
      git('add package.json CHANGELOG.md');
      git(`commit -m "release: bump version to ${newVersion}"`);
    }

    // Step 12: Create tag
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would create tag: ${tagName}`);
    } else {
      console.log(`\n✓ Creating tag: ${tagName}`);
      git(`tag ${tagName}`);
    }

    // Step 13: Build
    console.log('\n✓ Running pnpm build...');
    try {
      execSync('pnpm build', {
        cwd: rootDir,
        stdio: 'inherit',
      });
      console.log('\n✓ Build completed successfully');
    } catch {
      if (isDryRun) {
        console.error('\n✗ Build failed. In dry-run mode, continuing...');
      } else {
        console.error('\n✗ Build failed. Reverting changes...');
        git(`reset --hard HEAD~1`);
        git(`tag -d ${tagName}`);
        console.error('\n✗ Release aborted. Version update and tag have been reverted.');
        process.exit(1);
      }
    }

    // Step 14: Push commit and tag to origin
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would push ${RELEASE_BRANCH} and tag ${tagName} to origin`);
    } else {
      console.log(`\n✓ Pushing ${RELEASE_BRANCH} and tag to origin...`);
      git(`push origin ${RELEASE_BRANCH}`);
      git(`push origin ${tagName}`);
    }

    // Step 15: Create zip file
    console.log('\n✓ Creating release zip file...');
    await createZip(newVersion);

    // Step 16: Merge release back to main/master and push
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would merge ${RELEASE_BRANCH} back to ${currentBranch} and push`);
    } else {
      console.log(`\n✓ Merging ${RELEASE_BRANCH} back to ${currentBranch}...`);
      git(`checkout ${currentBranch}`);
      git(`merge ${RELEASE_BRANCH} --no-edit`);
      git(`push origin ${currentBranch}`);
    }

    if (isDryRun) {
      console.log('\n🧪 DRY RUN completed! No changes were made.');
      console.log(`\n📦 Would release version: ${newVersion}`);
      console.log(`🏷️  Would create tag: ${tagName}`);
    } else {
      console.log('\n🎉 Release completed successfully!');
      console.log(`\n📦 Version: ${newVersion}`);
      console.log(`🏷️  Tag: ${tagName}`);
    }
    console.log(
      `📁 Release zip: releases/qoqolo-photo-downloader-chrome-extension-v${newVersion.replace(/\./g, '_')}.zip`,
    );
  } catch (error) {
    console.error('\n✗ Release failed:', error.message);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('\n✗ Unexpected error:', error);
  process.exit(1);
});
