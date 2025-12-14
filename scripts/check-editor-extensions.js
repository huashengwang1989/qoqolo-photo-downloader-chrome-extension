/* eslint-disable no-undef */
// scripts/check-vscode-extensions.js
import { execSync } from 'child_process';

const requiredExtensions = [
  'dbaeumer.vscode-eslint',
  'stylelint.vscode-stylelint',
  'esbenp.prettier-vscode',
];

function checkExtensions(cliName) {
  try {
    const stdout = execSync(`${cliName} --list-extensions`, { encoding: 'utf8' });
    const installed = stdout.split(/\r?\n/).filter(Boolean);
    return installed;
  } catch {
    return null;
  }
}

let installedExtensions = null;
let editor = '';

if ((installedExtensions = checkExtensions('code'))) {
  editor = 'VS Code';
} else if ((installedExtensions = checkExtensions('cursor'))) {
  editor = 'Cursor';
} else {
  console.warn('\x1b[33m⚠️ Could not detect VS Code or Cursor CLI in PATH.\x1b[0m');
}

console.log(`>> Detected editor: \x1b[32m${editor}\x1b[0m`);
requiredExtensions.forEach(ext => {
  if (!installedExtensions.includes(ext)) {
    console.warn(`\x1b[33m⚠️ ${ext} is NOT installed.\x1b[0m Please install it in ${editor}.`);
  }
});
