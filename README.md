# Local PG 🐘

A global CLI tool that runs PGlite as a PostgreSQL-compatible server. Connect with any PostgreSQL client using standard connection strings or use the built-in web interface for database management!

## Features

- 🌍 **Global CLI tool** - Install once, use anywhere
- 🚀 **Zero-config setup** - No PostgreSQL installation required
- 🔌 **Standard PostgreSQL wire protocol** - Connect with any PostgreSQL client
- 💾 **Persistent or in-memory storage** - Choose what fits your needs
- 🛠️ **Simple CLI interface** - Easy command-line usage
- 🌐 **Web IDE** - Built-in web interface for querying and managing your database
- 🔍 **Debug support** - Built-in debugging capabilities
- ⚡ **Lightweight** - Only ~3MB, runs entirely in WebAssembly

## Installation

### Global Installation (Recommended)

```bash
# Install globally from npm
npm install -g local-pg

# Set up the web interface (optional but recommended)
npm run setup:web -g local-pg

# Now you can use it anywhere
local-pg --help
```

### Local Installation

```bash
# Install locally in your project
npm install local-pg

# Set up the web interface (optional but recommended)
npx local-pg setup:web

# Use with npx
npx local-pg --help
```

## Quick Start

### 1. Start the Server

```bash
# Quick start with in-memory database
local-pg

# Development mode with debug output
local-pg --db=memory:// --debug=1

# Persistent database
local-pg --db=./my-database

# Custom port and host
local-pg --port=5433 --host=0.0.0.0
```

### 2. Connect with Any PostgreSQL Client

```bash
# Using psql
psql -h localhost -p 5432 -U postgres template1

# Connection string format
postgres://postgres@localhost:5432/template1
```

## Usage

### Command Line Interface

```bash
local-pg [options]

# Alternative command
pg-local [options]
```

### Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--db=<path>` | Database path | `memory://` | `--db=./data/mydb` |
| `--dbname=<name>` | Custom database name | `template1` | `--dbname=mydb` |
| `--port=<port>` | Port to listen on | `5432` | `--port=5433` |
| `--host=<host>` | Host to bind to | `127.0.0.1` | `--host=0.0.0.0` |
| `--debug=<level>` | Debug level (0-5) | `0` | `--debug=1` |
| `--no-web` | Disable web interface | Web enabled | `--no-web` |
| `--web-port=<port>` | Web interface port | `3000` | `--web-port=8080` |
| `--version, -v` | Show version | - | `--version` |
| `--help, -h` | Show help | - | `--help` |

### Database Storage Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `memory://` | In-memory database | Development, testing, temporary data |
| `./data/mydb` | File-based storage | Persistent data, production use |
| `/absolute/path` | Absolute path | Custom storage location |

### Examples

```bash
# Quick development setup with web interface (default)
local-pg

# Start with debug output and custom web port
local-pg --db=memory:// --debug=1 --web-port=8080

# Custom database name
local-pg --dbname=myappdb

# Persistent database on custom port (no web interface)
local-pg --db=./data/myapp --port=5433 --no-web

# Bind to all network interfaces
local-pg --host=0.0.0.0

# Production-like setup
local-pg --db=/var/lib/pglite/myapp --port=5432 --dbname=production

# Show version
local-pg --version

# Get help
local-pg --help
```

## Connection Examples

### Node.js with node-postgres

```javascript
import pg from 'pg';

// Connection string approach
const client = new pg.Client('postgres://postgres@localhost:5432/template1');
await client.connect();

// Config object approach
const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'template1',
  user: 'postgres'
});
await client.connect();

const result = await client.query('SELECT * FROM users');
console.log(result.rows);
```

### Environment Variables

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=template1
export PGUSER=postgres

# Now you can use psql without arguments
psql
```

### Web Interface

Local PG comes with a built-in web-based database IDE that lets you:

- Browse database tables
- Run SQL queries
- View query results in a tabular format
- Easily manage your database without external tools

### Using the Web Interface

When you start Local PG, the web interface automatically launches and is accessible at:

```
http://localhost:3000
```

You can customize the web interface port:

```bash
local-pg --web-port=8080
```

Or disable it completely:

```bash
local-pg --no-web
```

## Other Tools

- **DBeaver**: Host=localhost, Port=5432, Database=template1, User=postgres
- **pgAdmin**: Same connection details as above
- **VS Code PostgreSQL extension**: Use the connection string
- **Prisma**: Use the connection string in your `.env` file

## Sample Database

The server automatically creates a sample `users` table with test data:

```sql
-- View sample data
SELECT * FROM users;

-- Insert new data
INSERT INTO users (name, email) VALUES ('Your Name', 'your.email@example.com');

-- Check PostgreSQL version
SELECT version();

-- List all tables
\dt
```

## Programmatic Usage

You can also use this package programmatically in your Node.js applications:

```javascript
import { startPGliteServer } from 'local-pg';

// Start server programmatically
const server = await startPGliteServer({
  db: './my-app-db',
  dbname: 'myappdb', // Custom database name
  port: 5432,
  host: 'localhost',
  debug: 1
});

console.log('Connection string:', server.connectionString);
// postgres://postgres@localhost:5432/myappdb

// Use the database
const result = await server.db.query('SELECT * FROM users');
console.log(result.rows);

// Stop the server
await server.stop();
```

## Publishing to NPM

To publish this package to npm (for package maintainers):

```bash
# 1. Update version in package.json
# 2. Build and test
npm test

# 3. Login to npm
npm login

# 4. Publish
npm publish

# 5. Users can then install globally
npm install -g local-pg
```

## Development Setup

If you want to contribute or modify this package:

```bash
# Clone the repository
git clone https://github.com/kalib-code/local-pg.git
cd local-pg

# Install dependencies
npm install

# Test locally
node bin/local-pg.js --help

# Link for global testing
npm link
local-pg --help

# Test the package
npm test
```

## Important Notes

### Single Connection Limit
⚠️ **PGlite supports only ONE connection at a time.** If you get "connection refused" or "too many clients" errors, make sure no other client is connected.

### Data Persistence
- **In-memory** (`memory://`): Data is lost when server stops
- **File-based** (e.g., `./data/mydb`): Data persists between restarts

### Performance
- In-memory databases are faster but ephemeral
- File-based databases persist data but are slightly slower
- Perfect for development, testing, and small applications

## Troubleshooting

### Connection Refused
```bash
# Make sure the server is running
node server.js

# Check if port is already in use
lsof -i :5432
```

### Too Many Clients
```bash
# Only one client can connect at a time
# Close other connections (psql, DBeaver, etc.)
```

### Database Locked
```bash
# Restart the server
# Make sure no other PGlite instance is using the same database file
```

## Use Cases

- **Development**: No need to install PostgreSQL locally
- **Testing**: Isolated test databases for each test suite
- **CI/CD**: Lightweight database for automated tests
- **Prototyping**: Quick database setup with custom database names
- **Education**: Learning PostgreSQL without complex setup
- **Database Management**: Built-in web IDE for SQL queries and data visualization
- **Edge Computing**: Portable database for edge applications
- **ORM Integration**: Use custom database names for compatibility with ORM tools
- **Data Exploration**: Web interface for exploring and visualizing database content

## File Structure

```
local-pg/
├── package.json              # Package configuration
├── index.js                  # Main module exports
├── bin/
│   └── local-pg.js           # CLI executable
├── custom-handler.js         # Low-level socket implementation
├── test-client.js            # Connection test utility
├── test-custom-db.js         # Custom database name test utility
├── pgweb/                    # Web interface React app
│   ├── package.json          # Web app dependencies
│   ├── src/                  # React source code
│   │   ├── app/              # Next.js app directory
│   │   └── components/       # React components
│   └── public/               # Static assets
├── README.md                 # Main documentation
├── CUSTOM_DB.md              # Custom database name documentation
├── CUSTOM_DB_FEATURE.md      # Detailed feature documentation
├── LICENSE                   # MIT License
└── .gitignore                # Git ignore rules
```

## Making it Global

After publishing to npm, users can install globally:

```bash
# Install from npm
npm install -g local-pg

# Use anywhere
local-pg --db=./myproject --port=5433
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- **npm package**: https://www.npmjs.com/package/local-pg
- **GitHub repository**: https://github.com/kalib-code/local-pg
- **PGlite**: https://github.com/electric-sql/pglite
- **Issues**: https://github.com/kalib-code/local-pg/issues
