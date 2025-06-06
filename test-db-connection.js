#!/usr/bin/env node

import pg from 'pg';
import chalk from 'chalk';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: 5434,
    host: 'localhost',
    // Use template1 as the default database name since custom names are not supported
    dbname: 'template1',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--host=')) {
      config.host = arg.split('=')[1];
    }
    // Custom database name is not supported by the underlying package
    // else if (arg.startsWith('--dbname=')) {
    //   config.dbname = arg.split('=')[1];
    // }
  }

  return config;
}

async function testDBConnection() {
  const config = parseArgs();
  
  console.log(chalk.bold.cyan('🧪 Testing PGlite Database Connection'));
  console.log(`${chalk.bold.cyan('📊 Connection Details:')}
  ${chalk.cyan('Host:')} ${config.host}
  ${chalk.cyan('Port:')} ${config.port}
  ${chalk.cyan('Database:')} ${config.dbname}
`);

  // Connection string approach
  const connectionString = `postgres://postgres@${config.host}:${config.port}/${config.dbname}`;
  console.log(`${chalk.cyan('🔗 Connection String:')} ${connectionString}`);

  try {
    // Connect using the pg client
    const client = new pg.Client({
      host: config.host,
      port: config.port,
      database: config.dbname,
      user: 'postgres'
    });

    await client.connect();
    console.log(chalk.green('✅ Connected successfully to the PGlite database!'));
    
    // Check database name
    const result = await client.query('SELECT current_database()');
    console.log(`${chalk.cyan('🏷️  Current database:')} ${result.rows[0].current_database}`);
    
    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log(`${chalk.cyan('📋 PostgreSQL Version:')} ${versionResult.rows[0].version}`);
    
    // List tables
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(chalk.cyan('📋 Tables in database:'));
    tableResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // List users
    const usersResult = await client.query('SELECT * FROM users ORDER BY id LIMIT 5');
    console.log(chalk.cyan('\n👥 Sample users:'));
    usersResult.rows.forEach(user => {
      console.log(`   ${user.id}: ${user.name} (${user.email})`);
    });

    // Create a test table specific to this database
    console.log(chalk.cyan('\n🛠️  Creating a test table specific to this database...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS db_test (
        id SERIAL PRIMARY KEY,
        db_name TEXT,
        test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert database name record
    await client.query(
      'INSERT INTO db_test (db_name) VALUES ($1)',
      ['template1 (default)']
    );
    
    // Get the record
    const dbTestResult = await client.query('SELECT * FROM db_test ORDER BY id DESC LIMIT 1');
    console.log(chalk.cyan('📝 Test record:'));
    console.log(`   ID: ${dbTestResult.rows[0].id}`);
    console.log(`   Database Name: ${dbTestResult.rows[0].db_name}`);
    console.log(`   Test Time: ${dbTestResult.rows[0].test_time}`);
    
    await client.end();
    console.log(chalk.green('\n✅ Test completed successfully!'));
    
  } catch (err) {
    console.error(chalk.red('❌ Connection failed:'), err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log(chalk.yellow(`
💡 Connection refused. Make sure the server is running:

   node custom-handler.js --port=${config.port}
`));
    }
  }
}

// Show usage help
function showHelp() {
  console.log(`
${chalk.bold.cyan('🧪 PGlite Database Connection Tester')}

Usage:
  node test-db-connection.js [options]

Options:
  --port=<port>     Port to connect to (default: 5434)
  --host=<host>     Host to connect to (default: localhost)
  --help            Show this help message

  Note: Custom database name is not supported by the underlying package.
  All connections use the default 'template1' database.

Examples:
  # Test with default settings
  node test-db-connection.js

  # Note: Custom database name is not supported
  # All connections use 'template1' by default

  # Test with custom port
  node test-db-connection.js --port=5435
`);
}

// Main program entry point
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  testDBConnection();
}