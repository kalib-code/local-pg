#!/usr/bin/env node

const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
  connection: '/connection',
  schema: '/schema',
  tables: '/tables?table=users',
  query: '/query'
};

async function testAPI() {
  console.log(chalk.bold.cyan('🧪 Testing Local PG Studio API'));
  console.log(chalk.cyan('Make sure both local-pg and local-pg-studio are running'));

  // Test connection API
  try {
    console.log(chalk.yellow('\n📡 Testing connection API...'));
    const connectionResponse = await fetch(BASE_URL + ENDPOINTS.connection);
    
    if (!connectionResponse.ok) {
      throw new Error(`API returned status ${connectionResponse.status}`);
    }
    
    const connectionData = await connectionResponse.json();
    console.log(chalk.green('✅ Connection API response:'));
    console.log(connectionData);

    if (!connectionData.connected) {
      console.log(chalk.red('❌ Not connected to database!'));
      console.log(chalk.yellow('Checking environment variables for PGPORT...'));
      
      // Check which port local-pg-studio is configured to use
      console.log(chalk.yellow(`Database connection settings in studio:`));
      console.log(`Host: ${connectionData.host}`);
      console.log(`Port: ${connectionData.port}`);
      console.log(`Database: ${connectionData.database}`);
      console.log(`User: ${connectionData.user}`);
      
      // Provide guidance for fixing the port
      console.log(chalk.yellow('\nTo fix connection issues:'));
      console.log('1. Make sure local-pg is running on port ' + connectionData.port);
      console.log('2. Or, run local-pg-studio with the correct port environment variables:');
      console.log('   PGPORT=5434 local-pg start:studio');
      
      return;
    }

    // Test schema API
    console.log(chalk.yellow('\n📊 Testing schema API...'));
    const schemaResponse = await fetch(BASE_URL + ENDPOINTS.schema);
    
    if (!schemaResponse.ok) {
      throw new Error(`Schema API returned status ${schemaResponse.status}`);
    }
    
    const schemaData = await schemaResponse.json();
    console.log(chalk.green('✅ Schema API returned data:'));
    console.log(`Found ${schemaData.length} tables`);
    
    // Test tables API
    console.log(chalk.yellow('\n📋 Testing tables API (users table)...'));
    const tablesResponse = await fetch(BASE_URL + ENDPOINTS.tables);
    
    if (!tablesResponse.ok) {
      throw new Error(`Tables API returned status ${tablesResponse.status}`);
    }
    
    const tablesData = await tablesResponse.json();
    console.log(chalk.green('✅ Tables API returned data:'));
    console.log(`Found ${tablesData.length} rows in users table`);
    
    // Test query API
    console.log(chalk.yellow('\n🔍 Testing query API...'));
    const queryResponse = await fetch(BASE_URL + ENDPOINTS.query, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: 'SELECT * FROM users LIMIT 3' }),
    });
    
    if (!queryResponse.ok) {
      throw new Error(`Query API returned status ${queryResponse.status}`);
    }
    
    const queryData = await queryResponse.json();
    console.log(chalk.green('✅ Query API returned data:'));
    console.log(`Query returned ${queryData.rows ? queryData.rows.length : 0} rows`);
    
    if (queryData.rows && queryData.rows.length > 0) {
      console.log('Sample row:');
      console.log(queryData.rows[0]);
    }
    
    console.log(chalk.bold.green('\n🎉 All API tests passed successfully!'));
    console.log(chalk.green('The web API is correctly connecting to local-pg.'));
    
  } catch (error) {
    console.error(chalk.bold.red('\n❌ API Test Failed:'));
    console.error(chalk.red(error.message));
    console.log(chalk.yellow('\nTroubleshooting tips:'));
    console.log(chalk.yellow('1. Make sure local-pg is running (run "local-pg" in a terminal)'));
    console.log(chalk.yellow('2. Make sure local-pg-studio is running (run "local-pg start:studio" in another terminal)'));
    console.log(chalk.yellow('3. Check that you can access http://localhost:3000 in your browser'));
    console.log(chalk.yellow('4. Verify that local-pg is listening on the expected port (default: 5432)'));
    console.log(chalk.yellow('5. Make sure the environment variables match:'));
    console.log(chalk.yellow('   PGPORT=5434 local-pg start:studio'));
  }
}

testAPI();