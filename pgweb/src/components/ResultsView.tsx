'use client';

interface ResultsViewProps {
  data: any;
  error: string | null;
  isLoading: boolean;
}

export default function ResultsView({ data, error, isLoading }: ResultsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded m-2">
        <h3 className="font-bold mb-2">Error</h3>
        <pre className="whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="p-4 text-gray-500 italic">
        {data && data.command ? (
          <p>
            Query executed successfully: {data.command} 
            {data.rowCount !== undefined ? ` (${data.rowCount} rows affected)` : ''}
          </p>
        ) : (
          <p>No results to display. Run a query to see results here.</p>
        )}
      </div>
    );
  }

  const columns = Object.keys(data.rows[0]);

  return (
    <div className="p-2 h-full overflow-auto">
      <div className="mb-2 text-sm text-gray-500">
        {data.rowCount !== undefined ? (
          <span>{data.rowCount} rows returned</span>
        ) : (
          <span>{data.rows.length} rows returned</span>
        )}
        {data.command && <span> • {data.command}</span>}
        {data.duration && <span> • {data.duration}ms</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {columns.map((col) => (
                <th 
                  key={col} 
                  className="py-2 px-4 text-left text-sm font-semibold border border-gray-200 dark:border-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: any, rowIndex: number) => (
              <tr 
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-850'}
              >
                {columns.map((col) => (
                  <td 
                    key={`${rowIndex}-${col}`}
                    className="py-2 px-4 text-sm border border-gray-200 dark:border-gray-700 max-w-xs truncate"
                  >
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null) {
    return '<null>';
  }
  
  if (value === undefined) {
    return '<undefined>';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  
  return String(value);
}