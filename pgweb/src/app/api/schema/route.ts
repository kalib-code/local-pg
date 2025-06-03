import { NextRequest, NextResponse } from 'next/server';
import { executeDbOperation } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tableName = searchParams.get('table');

  if (!tableName) {
    return NextResponse.json(
      { error: 'Table name is required' },
      { status: 400 }
    );
  }

  try {
    const columns = await executeDbOperation(async (client) => {
      // Query to get column information
      const result = await client.query(`
        SELECT
          a.attname as name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
          a.attnotnull as not_null,
          (
            SELECT EXISTS (
              SELECT 1 FROM pg_constraint c
              WHERE c.conrelid = a.attrelid
                AND c.conkey[1] = a.attnum
                AND c.contype = 'p'
            )
          ) as primary_key
        FROM pg_catalog.pg_attribute a
        WHERE a.attrelid = $1::regclass
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum;
      `, [tableName]);

      return result.rows.map((row: any) => ({
        name: row.name,
        type: row.type,
        isPrimaryKey: row.primary_key,
        isNullable: !row.not_null
      }));
    });

    return NextResponse.json({ columns });
  } catch (error: any) {
    console.error(`Error fetching schema for ${tableName}:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to fetch schema for ${tableName}` },
      { status: 500 }
    );
  }
}