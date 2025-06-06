# Custom Database Name Feature

## ⚠️ IMPORTANT: Feature Not Currently Supported

**The custom database name feature is not currently supported by the underlying @electric-sql/pglite-socket package (v0.0.6).**

## Current Status

Despite being documented and included in the command-line interface and API, the custom database name feature does not actually work in the current implementation. All connections must use the default database name `template1`.

## Default Database

The default database name in PGlite is `template1`. All clients should connect using this database name:

```bash
# Using psql
psql -h localhost -p 5432 -U postgres template1

# Connection string format
postgres://postgres@localhost:5432/template1

# Check the database name within psql
SELECT current_database();
```

## Command Line Usage (NOT WORKING)

The `--dbname` parameter is recognized but has no effect:

```bash
# This parameter is recognized but does not actually change the database name
local-pg --dbname=myappdb
```

## Programmatic Usage (NOT WORKING)

When using the API programmatically, the `dbname` option is also recognized but has no effect:

```javascript
import { startPGliteServer } from 'local-pg';

const server = await startPGliteServer({
  db: './my-app-db',
  // This parameter is recognized but does not actually change the database name
  // dbname: 'myappdb',
  port: 5432,
  host: 'localhost',
  debug: 0
});

// The connection string will use the default template1 database name
console.log(server.connectionString);
// postgres://postgres@localhost:5432/template1
```

## Future Support

Future versions of PGlite Socket may add support for custom database names. This documentation will be updated when that feature becomes available.

## Workarounds

If your application requires a specific database name:

1. Configure your application to use `template1` as the database name
2. If using an ORM, use its configuration to map to the correct database despite the name
3. For applications that absolutely require a specific database name, you may need to use a full PostgreSQL installation instead

## Planned Use Cases

When implemented, the custom database name feature will be useful for:

- Integration with ORMs and frameworks that expect specific database names
- Running multiple PGlite instances on different ports with different database names
- Making your PGlite database more identifiable in connection strings and logs