#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📦 Setting up PG Web IDE...');

// Path to web app directory
const webAppPath = join(__dirname, 'pgweb');

// Ensure the data directory exists
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  mkdirSync(dataDir, { recursive: true });
}

// Run npm install in the web app directory
console.log('🔧 Installing dependencies...');
const installProcess = spawn('npm', ['install'], {
  cwd: webAppPath,
  stdio: 'inherit'
});

installProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }

  console.log('✅ Dependencies installed successfully');
  console.log('🔧 Building the web app...');

  // Build the web app
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: webAppPath,
    stdio: 'inherit'
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Failed to build the web app');
      process.exit(1);
    }

    console.log('✅ Web app built successfully');
    console.log('🎉 Setup complete! You can now run local-pg to use the web interface.');
    console.log('📋 Usage:');
    console.log('  - Start with default settings: local-pg');
    console.log('  - Start with custom database: local-pg --db=./data/mydb');
    console.log('  - Disable web interface: local-pg --no-web');
    console.log('  - Change web port: local-pg --web-port=8080');
  });
});