#!/usr/bin/env node

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketHandler } from '@electric-sql/pglite-socket';
import { createServer } from 'net';
import chalk from 'chalk';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    db: 'memory://', // Default to in-memory
    port: 5432,
    host: '127.0.0.1',
    debug: 0,
    inspect: false,
    dbname: 'mydb', // Default database name
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
    } else if (arg.startsWith('--dbname=')) {
      config.dbname = arg.split('=')[1];
    } else if (arg === '--inspect') {
      config.inspect = true;
    }
  }

  return config;
}

async function startServer() {
  const config = parseArgs();

  console.log(chalk.bold.cyan('🚀 Starting Custom PGlite Socket Handler...'));
  console.log(`${chalk.bold.cyan('📊 Configuration:')}
  ${chalk.cyan('Database:')} ${config.db}
  ${chalk.cyan('DB Name:')} ${config.dbname}
  ${chalk.cyan('Host:')} ${config.host}
  ${chalk.cyan('Port:')} ${config.port}
  ${chalk.cyan('Debug Level:')} ${config.debug}
  ${chalk.cyan('Inspect Mode:')} ${config.inspect ? 'Enabled' : 'Disabled'}
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
      dbname: config.dbname, // Custom database name
      closeOnDetach: true, // Automatically close socket when detached
      inspect: config.inspect, // Print protocol data for debugging
    });

    // Create a server that uses the handler
    const server = createServer(async (socket) => {
      try {
        console.log(chalk.yellow(`🔌 Client connecting from ${socket.remoteAddress}:${socket.remotePort}`));
        await handler.attach(socket);
        console.log(chalk.green(`✅ Client connected from ${socket.remoteAddress}:${socket.remotePort}`));

        // Listen for socket events
        socket.on('close', () => {
          console.log(chalk.yellow(`📴 Client disconnected from ${socket.remoteAddress}:${socket.remotePort}`));
        });

        socket.on('error', (err) => {
          console.error(chalk.red(`❌ Socket error: ${err.message}`));
        });

      } catch (err) {
        console.error(chalk.red('❌ Error attaching socket:'), err);
        socket.end();
      }
    });

    // Start listening
    server.listen(config.port, config.host, () => {
      const address = server.address();
      console.log(`
${chalk.bold.green('🎉 PGlite Custom Socket Server is running!')}

${chalk.bold.cyan('Connection Details:')}
  ${chalk.cyan('Host:')} ${address.address}
  ${chalk.cyan('Port:')} ${address.port}
  ${chalk.cyan('Database:')} ${config.dbname}
  ${chalk.cyan('User:')} postgres ${chalk.gray('(no password required)')}

${chalk.bold.cyan('Connection String:')}
  ${chalk.yellow(`postgres://postgres@${address.address === '::' || address.address === '0.0.0.0' ? 'localhost' : address.address}:${address.port}/${config.dbname}`)}

${chalk.bold.cyan('Connect using psql:')}
  ${chalk.yellow(`psql -h ${address.address === '::' || address.address === '0.0.0.0' ? 'localhost' : address.address} -p ${address.port} -U postgres ${config.dbname}`)}

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
${chalk.bold.cyan('🐘 Custom PGlite Socket Handler')} - ${chalk.cyan('Low-level socket implementation example')}

Usage:
  node custom-handler.js [options]

Options:
  --db=<path>       Database path (default: memory://)
                    Examples:
                      memory://           - In-memory database
                      ./data/mydb         - Persistent file storage
                      /absolute/path/db   - Absolute path

  --dbname=<name>   Custom database name (default: mydb)
  --port=<port>     Port to listen on (default: 5432)
  --host=<host>     Host to bind to (default: 127.0.0.1)
  --debug=<level>   Debug level 0-5 (default: 0)
  --inspect         Enable protocol inspection (prints raw data)

Examples:
  # Start in-memory database with debug output
  node custom-handler.js --db=memory:// --debug=1

  # Start persistent database on custom port
  node custom-handler.js --db=./data/mydb --port=5433

  # Bind to all interfaces
  node custom-handler.js --host=0.0.0.0

  # Enable protocol inspection for debugging
  node custom-handler.js --inspect

  # Use a custom database name
  node custom-handler.js --dbname=customdb
`);
}

// Main program entry point
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  startServer();
}
