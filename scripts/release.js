#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync, spawn } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve root directory before any branch switching to ensure we always use the correct paths
// If running from temp file, use environment variable; otherwise resolve from __dirname
const rootDir = process.env.RELEASE_SCRIPT_ROOT_DIR || resolve(__dirname, '..');
// Temp script must be in project root (where node_modules exists) for imports to work
const TEMP_SCRIPT_PATH = resolve(rootDir, '.release-script-temp.js');

// Check if we're running from temp file
const isRunningFromTemp = __filename === TEMP_SCRIPT_PATH;

// If not running from temp, copy script to temp and re-execute
(async function bootstrap() {
  if (isRunningFromTemp) {
    return; // Already running from temp, continue with main script
  }

  try {
    // Copy current script to temp file in project root (where node_modules exists)
    const currentScriptContent = readFileSync(__filename, 'utf8');
    // Ensure temp file is written to project root
    const tempPath = resolve(rootDir, '.release-script-temp.js');
    writeFileSync(tempPath, currentScriptContent);
    console.log('📋 Copied release script to temp file for stability during branch switching...\n');

    // Re-execute from temp file, passing project root as env var so temp script knows where it is
    const nodeProcess = spawn('node', [tempPath, ...process.argv.slice(2)], {
      stdio: 'inherit',
      cwd: rootDir, // Critical: run from project root so node_modules can be found
      env: {
        ...process.env,
        RELEASE_SCRIPT_ROOT_DIR: rootDir, // Pass root dir to temp script
      },
    });

    nodeProcess.on('exit', (code) => {
      // Clean up temp file
      try {
        const tempPath = resolve(rootDir, '.release-script-temp.js');
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      process.exit(code || 0);
    });

    // Handle errors
    nodeProcess.on('error', (error) => {
      console.error('\n✗ Failed to execute temp script:', error.message);
      // Clean up temp file
      try {
        const tempPath = resolve(rootDir, '.release-script-temp.js');
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      process.exit(1);
    });

    // Wait indefinitely - the spawned process will handle everything
    await new Promise(() => {
      // Never resolves - the spawned process handles everything
    });
  } catch (error) {
    console.error('\n✗ Failed to create temp script:', error.message);
    console.error('  Continuing with current script (may fail if branch switching occurs)...');
    // Continue with current script as fallback - main() will run below
  }
})();

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

  let changelogContent;
  try {
    changelogContent = readFileSync(changelogPath, 'utf8');
  } catch (error) {
    console.warn('\n⚠️  Failed to read CHANGELOG.md:', error.message);
    return;
  }

  if (!changelogContent || typeof changelogContent !== 'string') {
    console.warn('\n⚠️  CHANGELOG.md is empty or invalid. Skipping changelog update.');
    return;
  }

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
    // Safely split and filter to ensure we only have valid strings
    const rawLines = changelogContent.split('\n') || [];
    const lines = rawLines
      .map((line) => (line != null ? String(line) : ''))
      .filter((line) => line !== null && line !== undefined);
    let insertIndex = -1;

    // Find where to insert (after header, before first version)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line &&
        typeof line === 'string' &&
        typeof line.trim === 'function' &&
        line.match(/^## \[/)
      ) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      // No version section found, append after header
      const emptyLineIndex = lines.findIndex((line) => {
        if (line == null || typeof line !== 'string' || typeof line.trim !== 'function') {
          return false;
        }
        try {
          const trimmed = String(line).trim();
          return trimmed === '';
        } catch {
          return false;
        }
      });
      insertIndex = emptyLineIndex >= 0 ? emptyLineIndex + 1 : lines.length;
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

  if (!newChangelogContent || typeof newChangelogContent !== 'string') {
    console.warn('\n⚠️  Failed to generate new changelog content. Skipping changelog update.');
    return;
  }

  try {
    writeFileSync(changelogPath, newChangelogContent);
    console.log(`\n✓ Updated CHANGELOG.md with version ${newVersion}`);
  } catch (error) {
    console.warn('\n⚠️  Failed to write CHANGELOG.md:', error.message);
    // Don't fail the release if changelog update fails
  }
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

  return new Promise((resolve, reject) => {
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          rl.close();
        } catch {
          // Ignore cleanup errors
        }
      }
    };

    rl.question(question, (answer) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        // Normalize the answer: trim whitespace and handle null/undefined
        const normalized = (answer || '').toString().trim();
        resolve(normalized);
      }
    });

    // Handle errors (e.g., stdin closed, EIO)
    rl.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(error);
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.once('SIGINT', () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('Interrupted by user'));
      }
    });
  });
}

// Main release process
async function main() {
  // Only run if we're executing from temp file (or bootstrap failed)
  if (!isRunningFromTemp) {
    // If we reach here, bootstrap failed, so we'll continue with current script
    console.warn('\n⚠️  Running from original script (temp file creation may have failed)');
    console.warn('  If branch switching occurs, the script may fail.\n');
  }

  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be committed or pushed\n');
  }
  console.log('🚀 Starting release process...\n');

  // Step 0: Store the original branch and ensure we start from main/master
  const originalBranch = getCurrentBranch();
  const isMainBranch = MAIN_BRANCHES.includes(originalBranch);

  if (!isMainBranch) {
    console.error(`✗ Error: Must be on main or master branch. Current branch: ${originalBranch}`);
    process.exit(1);
  }

  console.log(`✓ Current branch: ${originalBranch}`);

  // Important: All file paths are resolved relative to rootDir which is set before branch switching
  // This ensures we always reference files from the correct location regardless of branch

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
  let changelogUpdated;
  try {
    changelogUpdated = await prompt(
      '\nHave you updated Changelog? If not, please update at "[Unreleased]" section (yes/no): ',
    );
  } catch (error) {
    console.error('\n✗ Failed to read input:', error.message);
    console.log('  Release cancelled.');
    process.exit(1);
  }

  const answer = (changelogUpdated || '').toLowerCase().trim();
  if (answer !== 'yes' && answer !== 'y') {
    console.log('\n✗ Please update the changelog at "[Unreleased]" section before releasing.');
    console.log('  Release cancelled.');
    process.exit(0);
  }

  // Step 6: Confirm version
  let confirm;
  try {
    confirm = await prompt('\nProceed with this version? (yes/no): ');
  } catch (error) {
    console.error('\n✗ Failed to read input:', error.message);
    console.log('  Release cancelled.');
    process.exit(1);
  }

  const confirmAnswer = (confirm || '').toLowerCase().trim();
  if (confirmAnswer !== 'yes' && confirmAnswer !== 'y') {
    console.log('\n✗ Release cancelled.');
    process.exit(0);
  }

  try {
    // Step 7: Push main/master to origin if ahead
    if (isAheadOfOrigin(originalBranch)) {
      if (isDryRun) {
        console.log(`\n[DRY RUN] Would push ${originalBranch} to origin`);
      } else {
        console.log(`\n✓ ${originalBranch} is ahead of origin. Pushing...`);
        git(`push origin ${originalBranch}`);
      }
    } else {
      console.log(`\n✓ ${originalBranch} is up to date with origin`);
    }

    // Step 8: Ensure release branch exists and switch to it
    // Note: If release branch doesn't exist, it will be created from originalBranch (main/master)
    // This ensures it has all the latest files including the release script itself
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would ensure release branch exists and switch to it`);
    } else {
      ensureReleaseBranch(originalBranch);
      // After switching branches, verify critical files still exist
      // This handles the case where release branch might be outdated
      const packagePathAfterSwitch = resolve(rootDir, 'package.json');
      if (!existsSync(packagePathAfterSwitch)) {
        console.error('\n✗ Error: package.json not found after switching to release branch.');
        console.error('  The release branch may be missing critical files.');
        console.error('  This should not happen if release branch was created from main/master.');
        console.error('  Please check your git repository state.');
        process.exit(1);
      }
    }

    // Step 9: Merge main/master into release to ensure it's up to date
    // This is important for future releases when release branch might have diverged
    if (isDryRun) {
      console.log(`\n[DRY RUN] Would merge ${originalBranch} into ${RELEASE_BRANCH}`);
    } else {
      mergeMainIntoRelease(originalBranch);
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
      try {
        updateChangelog(newVersion);
      } catch (error) {
        console.warn('\n⚠️  Failed to update CHANGELOG.md:', error.message);
        console.warn('  Continuing with release...');
        // Don't fail the release if changelog update fails
      }
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
      console.log(`\n[DRY RUN] Would merge ${RELEASE_BRANCH} back to ${originalBranch} and push`);
    } else {
      console.log(`\n✓ Merging ${RELEASE_BRANCH} back to ${originalBranch}...`);
      git(`checkout ${originalBranch}`);
      git(`merge ${RELEASE_BRANCH} --no-edit`);
      git(`push origin ${originalBranch}`);
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

// Run main function (only if we're running from temp file, or bootstrap failed)
if (isRunningFromTemp) {
  main()
    .then(() => {
      // Clean up temp file
      try {
        const tempPath = resolve(rootDir, '.release-script-temp.js');
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
    })
    .catch((error) => {
      console.error('\n✗ Unexpected error:', error);
      // Clean up temp file
      try {
        const tempPath = resolve(rootDir, '.release-script-temp.js');
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      process.exit(1);
    });
} else {
  // Bootstrap will spawn a new process from temp file
  // If bootstrap fails, wait a bit then run main as fallback
  setTimeout(() => {
    console.warn('\n⚠️  Bootstrap did not spawn new process, running main as fallback...');
    main().catch((error) => {
      console.error('\n✗ Unexpected error:', error);
      process.exit(1);
    });
  }, 2000);
}
