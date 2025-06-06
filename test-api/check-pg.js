#!/usr/bin/env node

const { Client } = require('pg');
const chalk = require('chalk');

async function testPgConnection() {
  console.log(chalk.bold.cyan('🧪 Testing direct connection to local-pg'));
  console.log(chalk.cyan('Make sure local-pg is running'));

  // Try to connect to multiple possible ports
  const ports = [5432, 5434, 5433, 5435];
  
  for (const port of ports) {
    console.log(chalk.yellow(`\nTrying to connect on port ${port}...`));
    
    const client = new Client({
      host: 'localhost',
      port: port,
      database: 'template1',
      user: 'postgres',
      // No password needed for local-pg
      connectionTimeoutMillis: 3000
    });
    
    try {
      await client.connect();
      console.log(chalk.green(`✅ Connected to database on port ${port}!`));
      
      console.log(chalk.yellow('Running test query...'));
      const result = await client.query('SELECT current_database() as db, version() as version');
      console.log(chalk.green('✅ Query executed successfully!'));
      console.log('Database:', result.rows[0].db);
      console.log('Version:', result.rows[0].version);
      
      console.log(chalk.yellow('Checking for tables...'));
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log(chalk.green(`✅ Found ${tablesResult.rows.length} tables:`));
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      console.log(chalk.bold.green(`\n🎉 Direct connection to local-pg works on port ${port}!`));
      
      // Clean up
      await client.end();
      
      // We found a working connection, so exit
      return { success: true, port };
    } catch (error) {
      console.log(chalk.red(`❌ Could not connect on port ${port}: ${error.message}`));
      try {
        await client.end();
      } catch (e) {
        // Ignore errors during disconnect
      }
    }
  }
  
  // If we get here, all connection attempts failed
  console.error(chalk.bold.red('\n❌ Connection Test Failed on all ports!'));
  console.log(chalk.yellow('\nTroubleshooting tips:'));
  console.log(chalk.yellow('1. Make sure local-pg is running (run "local-pg" in a terminal)'));
  console.log(chalk.yellow('2. Verify which port local-pg is listening on (check console output)'));
  console.log(chalk.yellow('3. Check for any error messages in the local-pg console'));
  
  return { success: false };
}

// Run the test
testPgConnection().then(result => {
  if (result.success) {
    // Now let's create a test script for the web API using the discovered port
    console.log(chalk.cyan(`\nNow let's test the web API using port ${result.port}...`));
    console.log(chalk.yellow('Make sure local-pg-studio is running (run "local-pg start:studio" in another terminal)'));
    console.log(chalk.yellow('Then run: node test-api.js'));
  }
});