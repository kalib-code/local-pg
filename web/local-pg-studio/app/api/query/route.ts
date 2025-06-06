import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sql } = body;
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }
    
    const result = await executeQuery(sql);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error, detail: result.detail, position: result.position },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}