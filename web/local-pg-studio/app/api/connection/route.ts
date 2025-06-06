import { NextResponse } from 'next/server';
import { testConnection, getOrCreateClient } from '@/lib/db';

export async function GET() {
  try {
    // Return current connection details (without sensitive info)
    return NextResponse.json({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'mydb',
      user: process.env.PGUSER || 'postgres',
      connected: true
    });
  } catch (error) {
    const err = error as Error;
    console.error('API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to get connection info', connected: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, database, user, password } = body;
    
    // Test the connection with provided parameters
    const connectionOptions = {
      host,
      port: parseInt(port),
      database,
      user,
      password: password || '',
    };
    
    const isConnected = await testConnection(connectionOptions);
    
    if (isConnected) {
      // Use the new connection
      await getOrCreateClient(connectionOptions);

      return NextResponse.json({
        success: true,
        message: 'Connected successfully',
        connection: {
          host,
          port,
          database,
          user,
          connected: true
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to database',
          connected: false
        },
        { status: 400 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error('API Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to connect to database',
        connected: false
      },
      { status: 500 }
    );
  }
}