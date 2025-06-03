#!/usr/bin/env node

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { mkdir } from 'fs/promises';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { homedir, tmpdir } from 'os';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get PID file path in user's home directory
const getPidFilePath = () => {
  const configDir = join(homedir(), '.config', 'local-pg');
  return join(configDir, 'local-pg.pid');
};

// Create PID file with the current process ID
async function createPidFile(port) {
  const pidFilePath = getPidFilePath();

  // Create config directory if it doesn't exist
  await mkdir(dirname(pidFilePath), { recursive: true });

  try {
    // Write PID and port to file
    const pidData = JSON.stringify({
      pid: process.pid,
      port: port,
      timestamp: new Date().toISOString()
    });

    writeFileSync(pidFilePath, pidData);

    // Acquire a lock on the file to indicate the server is running
    await lockfile.lock(pidFilePath, { stale: 10000 });

    console.log(chalk.green(`📝 PID file created at ${pidFilePath}`));

    // Remove PID file on process exit
    const cleanupPidFile = () => {
      try {
        if (existsSync(pidFilePath)) {
          lockfile.unlockSync(pidFilePath);
          unlinkSync(pidFilePath);
          console.log(chalk.green(`🧹 PID file removed`));
        }
      } catch (err) {
        console.error(chalk.red('❌ Error cleaning up PID file:'), err);
      }
    };

    process.on('exit', cleanupPidFile);
    process.on('SIGINT', () => {
      cleanupPidFile();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanupPidFile();
      process.exit(0);
    });

    return true;
  } catch (err) {
    console.error(chalk.red('❌ Error creating PID file:'), err);
    return false;
  }
}

// Function to kill running server
async function killRunningServer() {
  const pidFilePath = getPidFilePath();

  if (!existsSync(pidFilePath)) {
    console.error(chalk.red('❌ No running server found'));
    return false;
  }

  try {
    // Read PID data
    const pidData = JSON.parse(readFileSync(pidFilePath, 'utf8'));
    const pid = pidData.pid;
    const port = pidData.port;

    console.log(chalk.cyan(`🔍 Found running server with PID ${pid} on port ${port}`));

    // Check if process is still running
    try {
      process.kill(pid, 0); // Just check if process exists

      // Send SIGTERM to the process
      process.kill(pid, 'SIGTERM');
      console.log(chalk.yellow(`🛑 Sent termination signal to process ${pid}`));

      // Clean up PID file
      try {
        lockfile.unlockSync(pidFilePath);
      } catch (err) {
        // Lock might be stale, ignore
      }

      unlinkSync(pidFilePath);
      console.log(chalk.green('✅ Server terminated successfully'));
      return true;
    } catch (err) {
      // Process doesn't exist, clean up stale PID file
      console.log(chalk.yellow('⚠️ Server is not running, cleaning up stale PID file'));
      try {
        unlinkSync(pidFilePath);
      } catch (err) {
        // Ignore if already deleted
      }
      return false;
    }
  } catch (err) {
    console.error(chalk.red('❌ Error reading PID file:'), err);
    return false;
  }
}

// Check if server is running
async function checkServerStatus() {
  const pidFilePath = getPidFilePath();

  if (!existsSync(pidFilePath)) {
    console.log(chalk.red('❌ No server is currently running'));
    return false;
  }

  try {
    // Read PID data
    const pidData = JSON.parse(readFileSync(pidFilePath, 'utf8'));
    const pid = pidData.pid;
    const port = pidData.port;
    const timestamp = pidData.timestamp;

    // Check if process is still running
    try {
      process.kill(pid, 0); // Just check if process exists

      const startTime = new Date(timestamp);
      const uptime = Math.floor((new Date() - startTime) / 1000); // in seconds

      console.log(`
${chalk.green('✅ Server is running')}
${chalk.cyan('🔢 PID:')} ${pid}
${chalk.cyan('🌐 Port:')} ${port}
${chalk.cyan('⏱️  Uptime:')} ${formatUptime(uptime)}
${chalk.cyan('🗓️  Started:')} ${startTime.toLocaleString()}
      `);
      return true;
    } catch (err) {
      // Process doesn't exist, clean up stale PID file
      console.log(chalk.yellow('⚠️ Server is not running (stale PID file detected)'));
      try {
        unlinkSync(pidFilePath);
      } catch (err) {
        // Ignore if already deleted
      }
      return false;
    }
  } catch (err) {
    console.error(chalk.red('❌ Error reading PID file:'), err);
    return false;
  }
}

// Format uptime in a human-readable way
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    db: 'memory://', // Default to in-memory
    port: 5432,
    host: '127.0.0.1',
    debug: 0,
    help: false,
    version: false,
    kill: false,
    status: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg === '--kill' || arg === '-k') {
      config.kill = true;
    } else if (arg === '--status' || arg === '-s') {
      config.status = true;
    } else if (arg.startsWith('--db=')) {
      config.db = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--host=')) {
      config.host = arg.split('=')[1];
    } else if (arg.startsWith('--debug=')) {
      config.debug = parseInt(arg.split('=')[1]);
    }
  }

  return config;
}

function showVersion() {
  console.log(chalk.bold.cyan('local-pg v1.0.0'));
  console.log(chalk.cyan('PGlite: PostgreSQL in WebAssembly'));
}

function showHelp() {
  console.log(`
${chalk.bold.cyan('🐘 Local PG Server')} - ${chalk.cyan('PostgreSQL-compatible server powered by PGlite')}

Usage:
  local-pg [options]
  pg-local [options]

Options:
  --db=<path>       Database path (default: memory://)
                    Examples:
                      memory://           - In-memory database
                      ./data/mydb         - Persistent file storage
                      /absolute/path/db   - Absolute path

  --port=<port>     Port to listen on (default: 5432)
  --host=<host>     Host to bind to (default: 127.0.0.1)
  --debug=<level>   Debug level 0-5 (default: 0)
  --kill, -k        Terminate a running server in the background
  --status, -s      Check if a server is running in the background
  --version, -v     Show version information
  --help, -h        Show this help message

Server Examples:
  # Start in-memory database with debug output
  local-pg --db=memory:// --debug=1

  # Start persistent database on custom port
  local-pg --db=./data/mydb --port=5433

  # Bind to all interfaces
  local-pg --host=0.0.0.0

  # Quick development setup
  pg-local --db=memory:// --debug=1

Process Management:
  # Start server in background
  local-pg &

  # Kill running server
  local-pg --kill

  # Check if server is running
  local-pg --status

Connection Examples:
  # Using psql
  psql -h localhost -p 5432 -U postgres template1

  # Connection string
  postgres://postgres@localhost:5432/template1

  # Node.js with pg
  const client = new Client('postgres://postgres@localhost:5432/template1');

🌐 More info: https://github.com/kalib-code/local-pg
`);
}

async function ensureDataDirectory(dbPath) {
  if (dbPath.startsWith('./') || dbPath.startsWith('/')) {
    const dir = dirname(resolve(dbPath));
    try {
      await mkdir(dir, { recursive: true });
      console.log(chalk.green(`📁 Created directory: ${dir}`));
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
}

async function initializeDatabase(db) {
  // Create some basic system tables and sample data
  await db.exec(`
    -- Ensure we have a proper database structure
    CREATE TABLE IF NOT EXISTS pg_stat_activity (
      pid INTEGER,
      usename TEXT,
      application_name TEXT,
      client_addr TEXT,
      state TEXT
    );

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

async function startServer() {
  const config = parseArgs();

  if (config.version) {
    showVersion();
    process.exit(0);
  }

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Check if kill command was provided
  if (config.kill) {
    const result = await killRunningServer();
    process.exit(result ? 0 : 1);
  }

  // Check if status command was provided
  if (config.status) {
    const result = await checkServerStatus();
    process.exit(result ? 0 : 1);
  }

  console.log(chalk.bold.cyan('🚀 Starting PGlite Server...'));
  console.log(`${chalk.bold.cyan('📊 Configuration:')}
  ${chalk.cyan('Database:')} ${config.db}
  ${chalk.cyan('Host:')} ${config.host}
  ${chalk.cyan('Port:')} ${config.port}
  ${chalk.cyan('Debug Level:')} ${config.debug}
`);

  try {
    // Ensure data directory exists for file-based databases
    if (config.db !== 'memory://') {
      await ensureDataDirectory(config.db);
    }

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

    // Initialize with some basic structure
    await initializeDatabase(db);

    // Create socket server
    console.log(chalk.cyan('🌐 Starting socket server...'));
    const server = new PGLiteSocketServer({
      db,
      port: config.port,
      host: config.host,
    });

    // Start the server
    await server.start();

    // Create PID file after server has started successfully
    await createPidFile(config.port);

    console.log(`
${chalk.bold.green('🎉 PGlite Server is running!')}

${chalk.bold.cyan('Connection Details:')}
  ${chalk.cyan('Host:')} ${config.host}
  ${chalk.cyan('Port:')} ${config.port}
  ${chalk.cyan('Database:')} template1
  ${chalk.cyan('User:')} postgres ${chalk.gray('(no password required)')}

${chalk.bold.cyan('Connection String:')}
  ${chalk.yellow(`postgres://postgres@${config.host}:${config.port}/template1`)}

${chalk.bold.cyan('Connect using psql:')}
  ${chalk.yellow(`psql -h ${config.host} -p ${config.port} -U postgres template1`)}

${chalk.bold.cyan('Sample Queries:')}
  ${chalk.green('SELECT * FROM users;')}
  ${chalk.green('SELECT * FROM posts JOIN users ON posts.user_id = users.id;')}
  ${chalk.green('SELECT version();')}
  ${chalk.green('\\dt')}  ${chalk.gray('-- List tables')}
  ${chalk.green('\\q')}   ${chalk.gray('-- Quit')}

${chalk.bold.yellow('⚠️  Note:')} PGlite supports ${chalk.bold('only ONE connection at a time')}.
    If connection fails, ensure no other client is connected.

${chalk.bold.cyan('Process Management:')}
  Check status: ${chalk.yellow('local-pg --status')}
  Terminate server: ${chalk.yellow('local-pg --kill')}

${chalk.bold.red('🛑 Press Ctrl+C to stop the server')}
`);

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${chalk.yellow(`🛑 Received ${signal}, shutting down gracefully...`)}`);
      try {
        await server.stop();
        await db.close();
        console.log(chalk.green('✅ Server stopped and database closed'));
        process.exit(0);
      } catch (err) {
        console.error(chalk.red('❌ Error during shutdown:'), err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Keep the process alive
    process.on('uncaughtException', (err) => {
      console.error(chalk.red('❌ Uncaught Exception:'), err);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
      shutdown('unhandledRejection');
    });

  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error);

    if (error.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`💡 Port ${config.port} is already in use. Try a different port:`));
      console.log(chalk.cyan('   pglite-server --port=5433'));
    } else if (error.code === 'EACCES') {
      console.log(chalk.yellow(`💡 Permission denied. Try using a port > 1024:`));
      console.log(chalk.cyan('   pglite-server --port=5433'));
    }

    process.exit(1);
  }
}

// Start the server
startServer();
