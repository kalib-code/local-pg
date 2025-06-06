#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to local-pg-studio directory
const studioPath = join(__dirname, 'web', 'local-pg-studio');

console.log('Setting up Local PG Studio...');

// Run npm install
console.log('Installing dependencies...');
const npmInstall = spawn('npm', ['install'], {
  cwd: studioPath,
  stdio: 'inherit'
});

npmInstall.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }

  console.log('Building Local PG Studio...');
  
  // Run npm run build
  const npmBuild = spawn('npm', ['run', 'build'], {
    cwd: studioPath,
    stdio: 'inherit'
  });

  npmBuild.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to build Local PG Studio');
      process.exit(1);
    }

    console.log(chalk.green('✅ Local PG Studio setup completed successfully!'));
    console.log(chalk.bold.cyan('\nTo use Local PG with Studio:'));
    console.log(chalk.cyan('  1. Start the database server:'));
    console.log(chalk.yellow('     npx local-pg'));
    console.log(chalk.cyan('  2. In another terminal, start the studio:'));
    console.log(chalk.yellow('     npx local-pg start:studio'));
    console.log(chalk.cyan('  3. Open http://localhost:3000 in your browser'));
  });
});