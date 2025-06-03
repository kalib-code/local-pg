import pg from 'pg';

async function testConnection(config = {}) {
  const { Client } = pg;

  const connectionConfig = {
    host: 'localhost',
    port: 5433,
    database: 'template1',
    user: 'postgres',
    ...config
  };

  // Connection string approach
  const connectionString = `postgres://${connectionConfig.user}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;

  console.log('🔌 Testing connection to PGlite server...');
  console.log(`📝 Connection string: ${connectionString}`);

  try {
    // Test with connection string
    const client = new Client(connectionString);
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test basic queries
    console.log('\n🧪 Running test queries...');

    // 1. Version check
    const versionResult = await client.query('SELECT version()');
    console.log('📋 PostgreSQL Version:', versionResult.rows[0].version);

    // 2. Current timestamp
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current Time:', timeResult.rows[0].current_time);

    // 3. List tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tables in database:');
    tablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // 4. Sample data from users table
    const usersResult = await client.query('SELECT * FROM users ORDER BY id LIMIT 5');
    console.log('\n👥 Sample users:');
    usersResult.rows.forEach(user => {
      console.log(`   ${user.id}: ${user.name} (${user.email})`);
    });

    // 5. Sample data from posts table
    const postsResult = await client.query(`
      SELECT p.title, u.name as author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id
      LIMIT 3
    `);
    console.log('\n📝 Sample posts:');
    postsResult.rows.forEach(post => {
      console.log(`   "${post.title}" by ${post.author}`);
    });

    // 6. Insert new user
    const testEmail = `test-${Date.now()}@example.com`;
    const insertResult = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      ['Test User', testEmail]
    );
    console.log('\n➕ Inserted new user:', insertResult.rows[0]);

    // 7. Count total users
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('📊 Total users:', countResult.rows[0].total);

    // 8. Test transaction
    await client.query('BEGIN');
    await client.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['Temp User', 'temp@example.com']);
    await client.query('ROLLBACK');
    console.log('🔄 Transaction test completed (rolled back)');

    // 9. Test database features
    const featuresResult = await client.query(`
      SELECT
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);
    console.log('\n📊 Database info:', featuresResult.rows[0]);

    await client.end();
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log(`
💡 Connection refused. Make sure the PGlite server is running:

   Global installation:
   local-pg

   Or with custom options:
   local-pg --db=memory:// --debug=1

   Alternative command:
   pg-local --db=./data/mydb --port=5432
`);
    } else if (error.message.includes('too many clients')) {
      console.log(`
💡 Too many clients connected. PGlite supports only one connection at a time.
   Make sure no other client is connected to the server.

   Close other connections like:
   - psql sessions
   - Database IDEs (DBeaver, pgAdmin, etc.)
   - Other applications using the same port
`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`
💡 Host not found. Check your connection settings:
   - Host: ${connectionConfig.host}
   - Port: ${connectionConfig.port}
`);
    }

    process.exit(1);
  }
}

// Additional connection examples
function showConnectionExamples() {
  console.log(`
🔗 Connection Examples:

1. Command Line Tools:
   psql -h localhost -p 5432 -U postgres template1
   pg_dump -h localhost -p 5432 -U postgres template1 > backup.sql

2. Node.js with pg:
   import pg from 'pg';
   const client = new pg.Client('postgres://postgres@localhost:5432/template1');
   await client.connect();

3. Node.js with config object:
   const client = new pg.Client({
     host: 'localhost',
     port: 5432,
     database: 'template1',
     user: 'postgres'
   });

4. Environment variables:
   export PGHOST=localhost
   export PGPORT=5432
   export PGDATABASE=template1
   export PGUSER=postgres
   psql  # Will use env vars

5. Popular Database Tools:
   - DBeaver: Host=localhost, Port=5432, Database=template1, User=postgres
   - pgAdmin: Same connection details as above
   - VS Code PostgreSQL extension: Use connection string
   - TablePlus: Use connection string or individual settings

6. ORMs and Query Builders:
   - Prisma: DATABASE_URL="postgres://postgres@localhost:5432/template1"
   - Drizzle: Same connection string
   - TypeORM: Same connection details
   - Sequelize: Same connection details

7. Testing with curl (if you have PostgREST):
   curl http://localhost:3000/users
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--examples')) {
  showConnectionExamples();
} else if (args.includes('--help')) {
  console.log(`
🧪 PGlite Server Connection Test

Usage: node test-client.js [options]

Options:
  --help        Show this help message
  --examples    Show connection examples
  --port=<port> Use custom port (default: 5432)
  --host=<host> Use custom host (default: localhost)

Examples:
  node test-client.js
  node test-client.js --port=5433
  node test-client.js --host=192.168.1.100 --port=5433
  node test-client.js --examples
`);
} else {
  // Parse custom connection settings
  const config = {};
  args.forEach(arg => {
    if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--host=')) {
      config.host = arg.split('=')[1];
    }
  });

  testConnection(config);
}
