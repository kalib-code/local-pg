import { Pool, PoolClient, QueryResult } from 'pg';
import { ConnectionOptions } from '@/types';

// Default connection parameters
const DEFAULT_CONNECTION: ConnectionOptions = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'template1',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  // Allow connection without SSL for local development
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Single client connection (PGlite only supports one connection at a time)
let client: PoolClient | null = null;
let isConnecting = false;
let connectionRetryCount = 0;
const MAX_RETRIES = 3;

/**
 * Sleep for a specified duration
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initialize or reuse a single database connection
 * PGlite only supports one connection at a time, so we'll use a single client
 * instead of a pool to avoid "Socket already attached" errors
 */
export async function getOrCreateClient(connectionOptions?: ConnectionOptions): Promise<PoolClient> {
  try {
    // If we're already trying to connect, wait a bit and reuse the result
    if (isConnecting) {
      console.log('Connection attempt already in progress, waiting...');
      await sleep(500); // Wait 500ms
      
      // If we now have a client, return it
      if (client) {
        return client;
      }
      
      // If we're still connecting, wait longer
      if (isConnecting) {
        await sleep(1000); // Wait 1 second more
        if (client) {
          return client;
        }
      }
    }
    
    // If we already have a client, check if it's still valid
    if (client) {
      try {
        // Simple ping to check if the connection is still alive
        await client.query('SELECT 1');
        return client;
      } catch (err) {
        console.log('Existing client is no longer valid, creating a new one');
        // Client is broken, will create a new one
        try {
          await client.release(true); // Force release with error
        } catch (releaseErr) {
          // Ignore release errors
        }
        client = null;
        connectionRetryCount = 0; // Reset retry counter when we know we need a new connection
      }
    }
    
    // Set flag to indicate we're trying to connect
    isConnecting = true;
    
    try {
      // Create a new connection with retry logic
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            // Exponential backoff - wait longer between each retry
            const backoffTime = Math.min(100 * Math.pow(2, attempt), 3000); // Max 3 seconds
            console.log(`Retrying connection (attempt ${attempt}/${MAX_RETRIES}) after ${backoffTime}ms...`);
            await sleep(backoffTime);
          }
          
          // Create a pool with a short connection timeout
          const tempPool = new Pool({
            ...DEFAULT_CONNECTION,
            ...connectionOptions,
            max: 1, // We only need one connection
            connectionTimeoutMillis: 3000 // 3 second timeout
          });
          
          client = await tempPool.connect();
          
          // Reset retry counter on success
          connectionRetryCount = 0;
          
          // When this client is released, we'll keep it for reuse instead of returning to pool
          const originalRelease = client.release;
          client.release = function(err?: Error | boolean) {
            // Override release to be a no-op
            // We'll manage the client lifecycle ourselves
            console.log('Client release called, but keeping connection for reuse');
            return Promise.resolve();
          };
          
          // Connection successful
          return client;
        } catch (err) {
          // If this was our last attempt, throw the error
          if (attempt === MAX_RETRIES) {
            throw err;
          }
          // Otherwise continue to next attempt
        }
      }
      
      // This should never be reached due to the throw in the loop, but TypeScript needs it
      throw new Error('Failed to connect after maximum retries');
      
    } finally {
      // Clear the connecting flag regardless of success or failure
      isConnecting = false;
    }
  } catch (error) {
    console.error('Failed to create database client after multiple attempts:', error);
    throw error;
  }
}

/**
 * Get a client (reuses existing connection)
 */
export async function getClient(): Promise<PoolClient> {
  return await getOrCreateClient();
}

/**
 * Execute a query with parameters
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const cli = await getOrCreateClient();
  return await cli.query(text, params);
}

/**
 * Get database schema information
 */
export async function getSchema(): Promise<Array<{
  name: string;
  columns: Array<{
    name: string;
    type: string;
    primaryKey: boolean;
    nullable: boolean;
    defaultValue?: string;
  }>;
  rowCount: number;
}>> {
  const tablesQuery = `
    SELECT 
      table_name as name
    FROM 
      information_schema.tables 
    WHERE 
      table_schema = 'public'
    ORDER BY
      table_name;
  `;

  const tables = await query(tablesQuery);
  
  // Since PGlite only supports one connection at a time, we'll fetch data sequentially
  // instead of using Promise.all which would try to make multiple parallel connections
  const tableDetails = [];
  
  for (const table of tables.rows) {
    // Get columns
    const columnsQuery = `
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable = 'NO' as is_not_null,
        column_default as default_value,
        (
          SELECT count(*) 
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_name = $1
          AND ccu.column_name = c.column_name
        ) > 0 as primary_key
      FROM 
        information_schema.columns c
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    
    const columns = await query(columnsQuery, [table.name]);
    
    // Get approximate row count
    const rowCountQuery = `
      SELECT 
        reltuples::bigint AS row_count
      FROM 
        pg_class
      WHERE
        relname = $1;
    `;
    
    const rowCount = await query(rowCountQuery, [table.name]);
    
    tableDetails.push({
      name: table.name,
      columns: columns.rows.map(col => ({
        name: col.name,
        type: col.type,
        primaryKey: col.primary_key,
        nullable: !col.is_not_null,
        defaultValue: col.default_value
      })),
      rowCount: parseInt(rowCount.rows[0]?.row_count || '0')
    });
  }
  
  return tableDetails;
}

/**
 * Get data from a specific table with optional limit and offset
 */
export async function getTableData(tableName: string, limit = 100, offset = 0): Promise<Record<string, unknown>[]> {
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  
  const dataQuery = `
    SELECT * FROM "${safeTableName}"
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  const result = await query(dataQuery);
  return result.rows;
}

/**
 * Execute a raw SQL query
 */
export async function executeQuery(sql: string): Promise<{
  rows?: Record<string, unknown>[];
  rowCount?: number;
  fields?: Array<{ name: string; dataTypeID: number }>;
  error?: string;
  detail?: string;
  position?: string;
}> {
  try {
    const result = await query(sql);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(f => ({
        name: f.name,
        dataTypeID: f.dataTypeID
      }))
    };
  } catch (error: any) {
    return {
      error: error.message,
      detail: error.detail,
      position: error.position
    };
  }
}

/**
 * Test the database connection
 */
export async function testConnection(connectionOptions?: ConnectionOptions): Promise<boolean> {
  try {
    // Close any existing connection first
    if (client) {
      try {
        await client.release(true);
      } catch (e) {
        // Ignore release errors
      }
      client = null;
    }
    
    // Try to create a new client with the test connection options
    await getOrCreateClient(connectionOptions);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}