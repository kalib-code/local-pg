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

console.log(chalk.bold.cyan('🚀 Starting Local PG Studio...'));
console.log(chalk.cyan('Make sure the local-pg server is running in another terminal!'));
console.log(chalk.yellow(`Connection details:
  PGHOST: ${process.env.PGHOST || 'localhost'}
  PGPORT: ${process.env.PGPORT || '5432'}
  PGDATABASE: ${process.env.PGDATABASE || 'template1'}
  PGUSER: ${process.env.PGUSER || 'postgres'}
`));
console.log(chalk.bold.yellow('⚠️  Note:') + chalk.yellow(' PGlite supports only ONE connection at a time.'));
console.log(chalk.yellow('     Studio has been configured to reuse a single database connection for all operations.'));

// Run npm run dev
const npmDev = spawn('npm', ['run', 'dev'], {
  cwd: studioPath,
  stdio: 'inherit',
  env: {
    ...process.env,
    PGHOST: process.env.PGHOST || 'localhost',
    PGPORT: process.env.PGPORT || '5432',
    PGDATABASE: process.env.PGDATABASE || 'template1',
    PGUSER: process.env.PGUSER || 'postgres',
  }
});

npmDev.on('close', (code) => {
  if (code !== 0) {
    console.error('Local PG Studio exited with code', code);
  }
});