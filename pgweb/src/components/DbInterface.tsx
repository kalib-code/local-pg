'use client';

import { useState } from 'react';
import { Database } from 'lucide-react';
import TableList from './TableList';
import QueryEditor from './QueryEditor';
import ResultsView from './ResultsView';
import DataView from './DataView';
import SchemaView from './SchemaView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

export default function DbInterface() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
  };

  const handleRunQuery = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Local-PG Studio</h1>
            <div className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              isConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs p-2 rounded">
          <strong>Note:</strong> PGlite supports only ONE connection at a time. If an operation is already in progress,
          other operations will be queued and processed when the connection becomes available.
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar with table list */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
          <TableList onSelectTable={handleTableSelect} selectedTable={selectedTable} />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="data" className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4">
              <TabsList className="flex space-x-1 mt-1">
                <TabsTrigger value="data" className="px-4 py-2">Data</TabsTrigger>
                <TabsTrigger value="schema" className="px-4 py-2">Schema</TabsTrigger>
                <TabsTrigger value="query" className="px-4 py-2">Query</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="data" className="h-full p-0 m-0 overflow-auto">
                <DataView tableName={selectedTable} />
              </TabsContent>

              <TabsContent value="schema" className="h-full p-0 m-0 overflow-auto">
                <SchemaView tableName={selectedTable} />
              </TabsContent>

              <TabsContent value="query" className="h-full p-0 m-0 flex flex-col">
                {/* Query editor */}
                <div className="h-1/3 border-b border-gray-200 dark:border-gray-700">
                  <QueryEditor
                    value={query}
                    onChange={setQuery}
                    onExecute={handleRunQuery}
                    isLoading={isLoading}
                  />
                </div>

                {/* Results view */}
                <div className="h-2/3 overflow-auto">
                  <ResultsView data={results} error={error} isLoading={isLoading} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}