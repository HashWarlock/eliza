#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Get all staged files
const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

if (stagedFiles.length === 0) {
  console.log('No staged files to lint');
  process.exit(0);
}

// Filter for files we want to process
const filesToLint = stagedFiles.filter((file) => {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md'];
  return extensions.some((ext) => file.endsWith(ext));
});

if (filesToLint.length === 0) {
  console.log('No matching files to lint');
  process.exit(0);
}

// Run prettier on the files
try {
  console.log('Running prettier on staged files...');
  const fileList = filesToLint.join(' ');
  execSync(`bun prettier --write ${fileList}`, { stdio: 'inherit' });

  // Add the formatted files back to staging
  execSync(`git add ${fileList}`, { stdio: 'inherit' });

  console.log('Pre-commit linting completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Error during pre-commit linting:', error.message);
  process.exit(1);
}
