# Custom Database Name Feature

PGlite Socket now supports setting a custom database name that will be presented to PostgreSQL clients.

## Overview

The custom database name feature allows you to specify a database name other than the default `template1` that PostgreSQL clients will connect to. This can be useful for applications that expect specific database names or when you want to run multiple PGlite instances with different database names.

## Command Line Usage

To use a custom database name, use the `--dbname` option:

```bash
# Start with a custom database name
local-pg --dbname=myappdb

# Combine with other options
local-pg --dbname=production --port=5433 --db=./data/prod-db
```

## Programmatic Usage

When using the API programmatically, specify the `dbname` option:

```javascript
import { startPGliteServer } from 'local-pg';

const server = await startPGliteServer({
  db: './my-app-db',
  dbname: 'myappdb',
  port: 5432,
  host: 'localhost',
  debug: 0
});

// The connection string will use the custom database name
console.log(server.connectionString);
// postgres://postgres@localhost:5432/myappdb
```

## Testing Custom Database Names

You can test if the custom database name is working correctly using the `test-custom-db.js` script:

```bash
# Start server with custom database name
node custom-handler.js --dbname=customdb --port=5434

# In another terminal, test the connection
node test-custom-db.js
```

You can also use any PostgreSQL client to connect:

```bash
# Using psql
psql -h localhost -p 5434 -U postgres customdb

# Check the database name within psql
SELECT current_database();
```

## Implementation Details

The custom database name is implemented at the PostgreSQL wire protocol level by the `PGLiteSocketHandler` class. When clients connect and request the specified database name, the handler will accept the connection regardless of the actual underlying PGlite database.

## Limitations

- PGlite supports only one connection at a time, regardless of the database name.
- The custom database name is primarily for presentation and compatibility with clients that require specific database names.
- The underlying database is still the same - this feature does not create separate database instances.

## Use Cases

- Integration with ORMs and frameworks that expect specific database names
- Running multiple PGlite instances on different ports with different database names
- Making your PGlite database more identifiable in connection strings and logs