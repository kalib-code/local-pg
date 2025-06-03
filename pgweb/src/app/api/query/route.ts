import { NextRequest, NextResponse } from 'next/server';
import { executeDbOperation } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await executeDbOperation(async (client) => {
      const startTime = Date.now();
      const result = await client.query(query);
      const duration = Date.now() - startTime;

      return {
        command: result.command,
        rowCount: result.rowCount,
        rows: result.rows,
        fields: result.fields.map((field: any) => ({
          name: field.name,
          dataTypeID: field.dataTypeID
        })),
        duration
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}