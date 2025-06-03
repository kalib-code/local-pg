import { NextResponse } from 'next/server';
import { executeDbOperation } from '@/lib/db';

export async function GET() {
  try {
    const tables = await executeDbOperation(async (client) => {
      // Query to get all tables in the current database
      const result = await client.query(`
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
        ORDER BY tablename;
      `);

      return result.rows.map((row: any) => row.tablename);
    });

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}