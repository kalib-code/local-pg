'use client';

import { useEffect, useState } from 'react';

interface SchemaViewProps {
  tableName: string | null;
}

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
}

export default function SchemaView({ tableName }: SchemaViewProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) return;

    const fetchSchema = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schema?table=${tableName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch schema for ${tableName}`);
        }
        
        const data = await response.json();
        setColumns(data.columns);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [tableName]);

  if (!tableName) {
    return (
      <div className="p-4 text-gray-500 italic">
        <p>Select a table to view its schema</p>
      </div>
    );
  }

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

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Table Schema: {tableName}</h2>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Column Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Data Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Constraints
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {columns.map((column) => (
              <tr key={column.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-medium">
                  {column.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {column.type}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="space-x-2">
                    {column.isPrimaryKey && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Primary Key
                      </span>
                    )}
                    {!column.isNullable && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        NOT NULL
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}