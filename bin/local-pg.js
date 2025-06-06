#!/usr/bin/env node

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketHandler } from '@electric-sql/pglite-socket';
import { createServer } from 'net';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    db: 'memory://', // Default to in-memory
    port: 5432,
    host: '127.0.0.1',
    debug: 0,
    inspect: false,
    webInterface: false, // Disable web interface by default (use studio instead)
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--db=')) {
      config.db = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--host=')) {
      config.host = arg.split('=')[1];
    } else if (arg.startsWith('--debug=')) {
      config.debug = parseInt(arg.split('=')[1]);
    } else if (arg === '--inspect') {
      config.inspect = true;
    } else if (arg === '--legacy-web') {
      config.webInterface = true;
    }
  }

  return config;
}

async function startServer() {
  const config = parseArgs();

  console.log(chalk.bold.cyan('🚀 Starting Custom PGlite Socket Handler...'));
  console.log(`${chalk.bold.cyan('📊 Configuration:')}
  ${chalk.cyan('Database:')} ${config.db}
  ${chalk.cyan('Host:')} ${config.host}
  ${chalk.cyan('Port:')} ${config.port}
  ${chalk.cyan('Debug Level:')} ${config.debug}
  ${chalk.cyan('Inspect Mode:')} ${config.inspect ? 'Enabled' : 'Disabled'}
  ${chalk.cyan('Studio:')} Use 'local-pg start:studio' in another terminal to launch the UI
`);

  try {
    // Create PGlite instance
    console.log(chalk.cyan('🔧 Initializing PGlite database...'));
    const db = await PGlite.create({
      dataDir: config.db,
      debug: config.debug,
      relaxedDurability: config.db.startsWith('memory://') ? true : false
    });

    // Wait for database to be ready
    await db.waitReady;
    console.log(chalk.green('✅ PGlite database ready'));

    // Initialize sample data
    await initializeDatabase(db);

    // Create a handler
    const handler = new PGLiteSocketHandler({
      db,
      closeOnDetach: true, // Automatically close socket when detached
      inspect: config.inspect, // Print protocol data for debugging
    });

    // Track the current connection
    let currentConnection = null;

    // Create a server that uses the handler
    const server = createServer(async (socket) => {
      try {
        console.log(chalk.yellow(`🔌 Client connecting from ${socket.remoteAddress}:${socket.remotePort}`));

        // Check if there's already an active connection
        if (currentConnection && !currentConnection.destroyed) {
          console.log(chalk.yellow(`⚠️  Connection already exists. Sending friendly message to new client.`));

          // Send a friendly message to the client before closing
          // This simulates a PostgreSQL error message in wire protocol format
          const errorBuffer = Buffer.from([
            'E'.charCodeAt(0), // Error message type
            0, 0, 0, 100,      // Message length (approximate)
            'S'.charCodeAt(0), // Severity field
            'E'.charCodeAt(0), 'R'.charCodeAt(0), 'R'.charCodeAt(0), 'O'.charCodeAt(0), 'R'.charCodeAt(0), 0, // ERROR
            'M'.charCodeAt(0), // Message field
          ]);

          // Add the error message text
          const message = "PGlite supports only ONE connection at a time. Wait for the current connection to close.";
          const messageBuffer = Buffer.from(message + '\0');

          // Combine buffers and write to socket
          socket.write(Buffer.concat([errorBuffer, messageBuffer]));

          // End the socket after a short delay
          setTimeout(() => socket.end(), 100);
          return;
        }

        await handler.attach(socket);
        console.log(chalk.green(`✅ Client connected from ${socket.remoteAddress}:${socket.remotePort}`));
        currentConnection = socket;

        // Listen for socket events
        socket.on('close', () => {
          console.log(chalk.yellow(`📴 Client disconnected from ${socket.remoteAddress}:${socket.remotePort}`));
          if (currentConnection === socket) {
            currentConnection = null;
          }
        });

        socket.on('error', (err) => {
          console.error(chalk.red(`❌ Socket error: ${err.message}`));
        });

      } catch (err) {
        console.error(chalk.red('❌ Error attaching socket:'), err);
        socket.end();
      }
    });

    // Variable for web interface process
    let webProcess = null;

    // Start listening
    server.listen(config.port, config.host, () => {
      const address = server.address();
      const dbHost = address.address === '::' || address.address === '0.0.0.0' ? 'localhost' : address.address;
      const connectionString = `postgres://postgres@${dbHost}:${address.port}/template1`;

      // Launch web interface if enabled
      if (config.webInterface) {
        try {
          // Set environment variables for web interface
          const env = {
            ...process.env,
            PGHOST: dbHost,
            PGPORT: String(address.port),
            PGDATABASE: 'template1',
            PGUSER: 'postgres',
            PORT: String(config.webPort)
          };

          // Path to web interface directory
          const webAppPath = join(__dirname, '..', 'pgweb');

          console.log(chalk.cyan('🌐 Starting web interface...'));
          console.log(chalk.gray(`  Path: ${webAppPath}`));

          // Check if we should run in dev or production mode
          // If .next directory exists, we can run in production mode
          const nextBuildPath = join(webAppPath, '.next');
          const isNextBuildExists = existsSync(nextBuildPath);

          if (isNextBuildExists) {
            // Start Next.js production server
            console.log(chalk.cyan('📦 Found Next.js build, starting in production mode'));
            webProcess = spawn('npm', ['run', 'start'], {
              cwd: webAppPath,
              env,
              stdio: ['ignore', 'pipe', 'pipe']
            });
          } else {
            // Start Next.js dev server
            console.log(chalk.cyan('🧪 No Next.js build found, starting in development mode'));
            webProcess = spawn('npm', ['run', 'dev'], {
              cwd: webAppPath,
              env,
              stdio: ['ignore', 'pipe', 'pipe']
            });
          }

          // Handle web interface stdout
          webProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output.includes('started server on') || output.includes('ready on')) {
              console.log(chalk.green('✅ Web interface is running!'));
            }
          });

          // Handle web interface stderr
          webProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output.includes('error')) {
              console.error(chalk.red(`❌ Web interface error: ${output}`));
            }
          });

          // Handle web process exit
          webProcess.on('exit', (code) => {
            if (code !== 0) {
              console.error(chalk.red(`❌ Web interface exited with code ${code}`));
            } else {
              console.log(chalk.yellow('🔌 Web interface stopped'));
            }
          });
        } catch (err) {
          console.error(chalk.red('❌ Failed to start web interface:'), err);
        }
      }

      // Log connection information
      console.log(`
${chalk.bold.green('🎉 PGlite Custom Socket Server is running!')}

${chalk.bold.cyan('Connection Details:')}
  ${chalk.cyan('Host:')} ${dbHost}
  ${chalk.cyan('Port:')} ${address.port}
  ${chalk.cyan('Database:')} template1
  ${chalk.cyan('User:')} postgres ${chalk.gray('(no password required)')}

${chalk.bold.cyan('Connection String:')}
  ${chalk.yellow(connectionString)}

${chalk.bold.cyan('Connect using psql:')}
  ${chalk.yellow(`psql -h ${dbHost} -p ${address.port} -U postgres template1`)}

${chalk.bold.cyan('Use Local PG Studio (recommended):')}
  ${chalk.yellow(`local-pg start:studio`)} ${chalk.gray('(in another terminal)')}
  ${chalk.gray('Then visit:')} ${chalk.yellow('http://localhost:3000')}

${config.webInterface ? chalk.bold.cyan('Legacy Web Interface:') + '\n  ' + chalk.yellow(`http://localhost:${config.webPort}`) + '\n' : ''}
${chalk.bold.yellow('⚠️  Note:')} PGlite supports ${chalk.bold('only ONE connection at a time')}.
    If connection fails, ensure no other client is connected.

${chalk.bold.red('🛑 Press Ctrl+C to stop the server')}
`);
    });

    // Handle server events
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(chalk.red(`❌ Port ${config.port} is already in use. Try a different port.`));
      } else {
        console.error(chalk.red('❌ Server error:'), err);
      }
      process.exit(1);
    });

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${chalk.yellow(`🛑 Received ${signal}, shutting down gracefully...`)}`);
      try {
        server.close();
        handler.detach(true); // Detach and close any connected socket
        await db.close();

        // Kill web interface process if it exists
        if (webProcess && !webProcess.killed) {
          webProcess.kill('SIGTERM');
          console.log(chalk.yellow('🔌 Stopping web interface...'));
        }

        console.log(chalk.green('✅ Server stopped and database closed'));
        process.exit(0);
      } catch (err) {
        console.error(chalk.red('❌ Error during shutdown:'), err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error);
    process.exit(1);
  }
}

async function initializeDatabase(db) {
  // Create some basic sample data
  await db.exec(`
    -- Create a sample table for testing
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create a posts table for more complex examples
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert sample data if table is empty
    INSERT INTO users (name, email)
    SELECT 'John Doe', 'john@example.com'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'john@example.com');

    INSERT INTO users (name, email)
    SELECT 'Jane Smith', 'jane@example.com'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jane@example.com');

    INSERT INTO users (name, email)
    SELECT 'Alice Johnson', 'alice@example.com'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alice@example.com');

    -- Insert sample posts
    INSERT INTO posts (title, content, user_id)
    SELECT 'Welcome to PGlite', 'This is a sample post in your PGlite database!', 1
    WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Welcome to PGlite');

    INSERT INTO posts (title, content, user_id)
    SELECT 'Getting Started', 'PGlite is PostgreSQL compiled to WebAssembly.', 2
    WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Getting Started');
  `);

  console.log(chalk.green('✅ Database initialized with sample data'));
}

// Show usage help
function showHelp() {
  console.log(`
${chalk.bold.cyan('🐘 Local PG with Web Interface')} - ${chalk.cyan('PostgreSQL-compatible server with web IDE')}

Usage:
  local-pg [options]         Start the database server
  local-pg setup:studio      Set up the Local PG Studio (one-time setup)
  local-pg start:studio      Start the Local PG Studio web interface

Server Options:
  --db=<path>       Database path (default: memory://)
                    Examples:
                      memory://           - In-memory database
                      ./data/mydb         - Persistent file storage
                      /absolute/path/db   - Absolute path

  --port=<port>     Port to listen on (default: 5432)
  --host=<host>     Host to bind to (default: 127.0.0.1)
  --debug=<level>   Debug level 0-5 (default: 0)
  --inspect         Enable protocol inspection (prints raw data)

  # Web Interface Options
  --legacy-web      Enable legacy web interface (Studio is recommended instead)

Examples:
  # Start the server with default options
  local-pg

  # Set up Local PG Studio (do this once)
  local-pg setup:studio

  # Start Local PG Studio (in a separate terminal)
  local-pg start:studio

  # Start with in-memory database and debug output
  local-pg --db=memory:// --debug=1

  # Start persistent database on custom port
  local-pg --db=./data/mydb --port=5433

  # Bind to all interfaces
  local-pg --host=0.0.0.0

  # Enable protocol inspection for debugging
  local-pg --inspect

  # Use the legacy web interface
  local-pg --legacy-web
`);
}

// Special commands
async function handleSpecialCommands() {
  const args = process.argv.slice(2);

  // Handle setup:studio command
  if (args[0] === 'setup:studio') {
    const { spawn } = await import('child_process');
    const { dirname, join } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const setupPath = join(__dirname, '..', 'setup-studio.js');

    console.log(chalk.bold.cyan('Running setup:studio script...'));
    const process = spawn('node', [setupPath], { stdio: 'inherit' });
    process.on('error', (err) => {
      console.error(chalk.red(`Error running setup:studio: ${err.message}`));
    });
    return true;
  }

  // Handle start:studio command
  if (args[0] === 'start:studio') {
    const { spawn } = await import('child_process');
    const { dirname, join } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const startPath = join(__dirname, '..', 'start-studio.js');

    console.log(chalk.bold.cyan('Running start:studio script...'));
    const process = spawn('node', [startPath], { stdio: 'inherit' });
    process.on('error', (err) => {
      console.error(chalk.red(`Error running start:studio: ${err.message}`));
    });
    return true;
  }

  return false;
}

// Main program entry point
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else if (process.argv.length > 2 && process.argv[2].includes(':')) {
  // Handle special commands like setup:studio or start:studio
  handleSpecialCommands().then(handled => {
    if (!handled) {
      console.error(`Unknown command: ${process.argv[2]}`);
      showHelp();
    }
  });
} else {
  startServer();
}
