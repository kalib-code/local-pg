'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface TableListProps {
  onSelectTable: (tableName: string) => void;
  selectedTable: string | null;
}

interface TableInfo {
  name: string;
  rowCount?: number;
  columnCount?: number;
}

export default function TableList({ onSelectTable, selectedTable }: TableListProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');

        if (!response.ok) {
          throw new Error('Failed to fetch tables');
        }

        const data = await response.json();

        // Convert simple string array to TableInfo array
        const tableInfos = data.tables.map((name: string) => ({
          name,
          // We'll fetch these details later or when the table is selected
          rowCount: undefined,
          columnCount: undefined
        }));

        setTables(tableInfos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Filter tables based on search term
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <p>Loading tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">TABLES</h2>
        {filteredTables.length === 0 ? (
          <p className="text-gray-500 italic px-2">No tables found</p>
        ) : (
          <div className="space-y-1">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedTable === table.name
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium mb-1">{table.name}</div>
                {table.columnCount && table.rowCount && (
                  <div className="text-xs opacity-70">
                    {table.columnCount} columns • {table.rowCount.toLocaleString()} rows
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}