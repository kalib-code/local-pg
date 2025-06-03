# Custom Database Name in PGlite Socket

This document provides information on how to use the custom database name feature in the PGlite socket implementation.

## Overview

PGlite-socket allows you to specify a custom database name that will be presented to PostgreSQL clients. While PGlite itself doesn't have the concept of multiple databases (it's a single database instance), the socket layer can present itself with a custom database name to clients.

## Using Custom Database Names

### With custom-handler.js

The `custom-handler.js` script provides a low-level implementation of PGlite-socket that supports custom database names:

```bash
# Start with default database name (mydb)
node custom-handler.js

# Start with custom database name
node custom-handler.js --dbname=customdb

# Start with custom database name, port, and debug level
node custom-handler.js --dbname=customdb --port=5434 --debug=1
```

### Implementation Details

Custom database names are implemented by passing the `dbname` option to the `PGLiteSocketHandler` constructor:

```javascript
const handler = new PGLiteSocketHandler({
  db,
  dbname: 'customdb', // Custom database name
  closeOnDetach: true,
  inspect: false,
});
```

## Testing Custom Database Names

You can test the custom database name functionality manually using PostgreSQL clients like `psql` or the Node.js `pg` client.

### Using psql

Connect to the custom database using the psql command-line tool:

```bash
# Start the server with a custom database name
node custom-handler.js --dbname=customdb --port=5434

# In another terminal, connect using psql
psql -h localhost -p 5434 -U postgres customdb
```

The psql connection should succeed and you'll be connected to the database with your custom name.

### Using the pg module

Create a test script to connect to your custom database:

```javascript
// test-custom-db.js
import pg from 'pg';

async function testCustomDB() {
  const client = new pg.Client({
    host: 'localhost',
    port: 5434,
    database: 'customdb', // Use the custom database name
    user: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to custom database!');
    
    // Check database name
    const result = await client.query('SELECT current_database()');
    console.log(`🏷️ Current database: ${result.rows[0].current_database}`);
    
    // Run a test query
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    tableResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testCustomDB();
```

Run the test script:

```bash
node test-custom-db.js
```

## Limitations

- PGlite only supports one connection at a time, regardless of the database name
- The database name is primarily for presentation purposes and doesn't create separate database instances
- Some PostgreSQL clients might require specific database names to work properly

## Troubleshooting

If you encounter connection issues:

1. Ensure the server is running with the correct database name
2. Make sure you're using the same database name in your connection string
3. Verify that no other client is currently connected
4. Check that the port is correct and not being used by another service

## Example Use Cases

Custom database names are useful for:

- Integrating with applications that expect specific database names
- Running multiple PGlite instances with different database names for different purposes
- Testing database-specific features that rely on database name identification