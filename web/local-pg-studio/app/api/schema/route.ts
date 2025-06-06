import { NextResponse } from 'next/server';
import { getSchema } from '@/lib/db';

export async function GET() {
  try {
    const schema = await getSchema();
    return NextResponse.json(schema);
  } catch (error) {
    const err = error as Error;
    console.error('API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch database schema' },
      { status: 500 }
    );
  }
}