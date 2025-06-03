'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

interface DataViewProps {
  tableName: string | null;
}

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
}

export default function DataView({ tableName }: DataViewProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);

  const fetchTableData = async () => {
    if (!tableName) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/data?table=${tableName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${tableName}`);
      }
      
      const data = await response.json();
      setRows(data.rows);
      setColumns(data.columns);
      setRowCount(data.rowCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [tableName]);

  const handleRefresh = () => {
    fetchTableData();
  };

  const handleAddRow = () => {
    // This will be implemented later
    alert('Add row functionality will be implemented soon');
  };

  const handleEditRow = (row: any) => {
    // This will be implemented later
    alert(`Edit row functionality will be implemented soon`);
  };

  const handleDeleteRow = (row: any) => {
    // This will be implemented later
    alert(`Delete row functionality will be implemented soon`);
  };

  if (!tableName) {
    return (
      <div className="p-4 text-gray-500 italic">
        <p>Select a table to view its data</p>
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">{tableName}</h2>
          <p className="text-sm text-gray-500">{rowCount.toLocaleString()} total rows</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.name} 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    <div>
                      {column.name}
                      {column.isPrimaryKey && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          PK
                        </span>
                      )}
                    </div>
                    <div className="text-xxs font-normal text-gray-400 dark:text-gray-500">
                      {column.type}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((column) => (
                    <td key={column.name} className="px-4 py-3 text-sm">
                      {row[column.name] === null ? (
                        <span className="text-gray-400 dark:text-gray-500 italic">NULL</span>
                      ) : typeof row[column.name] === 'boolean' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          row[column.name] ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {row[column.name].toString()}
                        </span>
                      ) : (
                        String(row[column.name])
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditRow(row)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(row)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}