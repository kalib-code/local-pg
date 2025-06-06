# Custom Database Name in PGlite Socket

## ⚠️ IMPORTANT: Feature Not Currently Supported

**The custom database name feature is not currently supported by the underlying @electric-sql/pglite-socket package (v0.0.6).**

While the custom database name feature was planned and documented, the current implementation of PGlite Socket does not support setting a custom database name. All connections will use the default database name `template1`.

## Default Database

The default database name in PGlite is `template1`, which is standard in PostgreSQL. All clients should connect to this database:

```bash
# Connect using psql
psql -h localhost -p 5432 -U postgres template1

# Connection string format
postgres://postgres@localhost:5432/template1
```

## Future Support

Future versions of PGlite Socket may add support for custom database names. This documentation will be updated when that feature becomes available.

## Workarounds

If your application requires a specific database name:

1. Configure your application to use `template1` as the database name
2. If using an ORM, use its configuration to map to the correct database despite the name
3. For applications that absolutely require a specific database name, you may need to use a full PostgreSQL installation instead

## Planned Implementation

When the feature is implemented, it will work as follows:

```javascript
const handler = new PGLiteSocketHandler({
  db,
  dbname: 'customdb', // Custom database name (not currently supported)
  closeOnDetach: true,
  inspect: false,
});
```