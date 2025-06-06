#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testStudio() {
  console.log('🧪 Testing local-pg with Local PG Studio...');
  console.log('🔧 This test verifies that both the server and studio UI start correctly');

  // Start local-pg with a non-standard port to avoid conflicts
  const localPg = spawn('node', [join(__dirname, 'bin', 'local-pg.js'), '--db=memory://', '--port=5433'], {
    stdio: 'pipe',
  });

  let serverStarted = false;

  // Listen for local-pg output
  localPg.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📤 Server output:', output);

    if (output.includes('PGlite Custom Socket Server is running')) {
      serverStarted = true;
      console.log('✅ PostgreSQL server started successfully');
      
      // Start the studio UI
      startStudio();
    }
  });

  // Listen for errors
  localPg.stderr.on('data', (data) => {
    console.error('❌ Server error:', data.toString());
  });

  // Function to start studio UI
  async function startStudio() {
    console.log('🚀 Starting Local PG Studio...');
    
    // Set up environment variables for studio
    const env = {
      ...process.env,
      PGHOST: 'localhost',
      PGPORT: '5433',
      PGDATABASE: 'mydb',
      PGUSER: 'postgres',
    };
    
    // Start studio in dev mode
    const studioPath = join(__dirname, 'web', 'local-pg-studio');
    const studio = spawn('npm', ['run', 'dev'], {
      cwd: studioPath,
      env,
      stdio: 'pipe',
    });
    
    let studioStarted = false;
    
    // Listen for studio output
    studio.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📤 Studio output:', output);
      
      if (output.includes('Ready in') || output.includes('ready on') || output.includes('started server on')) {
        studioStarted = true;
        console.log('✅ Local PG Studio started successfully');
        
        // For this simple test, if both server and studio start, we consider it a success
        console.log('🎉 Test passed! Both server and studio started successfully.');
        
        // Clean up
        studio.kill('SIGINT');
        localPg.kill('SIGINT');
        
        process.exit(0);
      }
    });
    
    // Listen for studio errors
    studio.stderr.on('data', (data) => {
      const output = data.toString();
      // Filter out normal Next.js output that goes to stderr
      if (!output.includes('warn') && !output.includes('info') && !output.includes('wait')) {
        console.error('❌ Studio error:', output);
      }
    });
    
    // Set a timeout to kill the processes after 60 seconds
    await setTimeout(60000);
    
    if (!studioStarted) {
      console.error('❌ Test failed! Studio did not start within 60 seconds.');
      studio.kill('SIGINT');
      localPg.kill('SIGINT');
      process.exit(1);
    }
  }

  // Set a timeout to kill the process after 30 seconds if server doesn't start
  await setTimeout(30000);

  if (!serverStarted) {
    console.error('❌ Test failed! Server did not start within 30 seconds.');
    localPg.kill('SIGINT');
    process.exit(1);
  }
}

testStudio().catch((err) => {
  console.error('❌ Test error:', err);
  process.exit(1);
});