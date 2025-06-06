import { NextResponse } from 'next/server';
import { getSchema, getTableData } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    
    if (tableName) {
      // Get data for a specific table
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');
      
      const data = await getTableData(tableName, limit, offset);
      return NextResponse.json(data);
    } else {
      // Get all tables if no table name specified
      const schema = await getSchema();
      return NextResponse.json(schema);
    }
  } catch (error) {
    const err = error as Error;
    console.error('API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}