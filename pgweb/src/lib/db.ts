import { Pool } from 'pg';

// Create a singleton connection pool with max 1 client
// This helps manage the single-connection limitation of PGlite
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'mydb', // Default from local-pg
  user: process.env.PGUSER || 'postgres',
  // No password needed for local-pg
  max: 1, // Maximum 1 client in the pool
  idleTimeoutMillis: 1000, // Close idle clients after 1 second
});

// Track if a query is in progress
let queryInProgress = false;

// Queue for pending operations
const operationQueue: (() => Promise<void>)[] = [];

// Function to process the queue
async function processQueue() {
  if (operationQueue.length === 0 || queryInProgress) {
    return;
  }
  
  queryInProgress = true;
  
  try {
    const nextOperation = operationQueue.shift();
    if (nextOperation) {
      await nextOperation();
    }
  } finally {
    queryInProgress = false;
    
    // Process next item in queue if any
    if (operationQueue.length > 0) {
      processQueue();
    }
  }
}

// Execute a database operation with proper queuing
export async function executeDbOperation<T>(operation: (client: any) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    // Add operation to queue
    operationQueue.push(async () => {
      let client;
      
      try {
        client = await pool.connect();
        const result = await operation(client);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        if (client) {
          client.release();
        }
      }
    });
    
    // Start processing the queue if not already processing
    processQueue();
  });
}

export { pool };