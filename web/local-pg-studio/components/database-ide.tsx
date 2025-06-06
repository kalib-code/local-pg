"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Database, Edit, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
// import { useToast } from "@/hooks/use-toast"

import { TableInfo, ColumnInfo, ConnectionInfo } from "@/types"

export default function DatabaseIDE() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM users LIMIT 10;")
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[]>([])
  const [queryFields, setQueryFields] = useState<Array<{ name: string; dataTypeID: number }>>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([])
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  // const { toast } = useToast()

  // Load connection status
  useEffect(() => {
    const loadData = async () => {
      try {
        // Step 1: First check connection
        setIsLoading(true);
        console.log("Fetching connection status...");
        const connectionResponse = await fetch('/api/connection')
        const connectionData = await connectionResponse.json()

        setConnectionInfo(connectionData)
        setIsConnected(connectionData.connected)

        if (!connectionData.connected) {
          console.log("Not connected to database");
          setIsLoading(false);
          return;
        }

        // Wait a bit to ensure connection is fully established
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Then fetch schema (tables list)
        console.log("Fetching schema...");
        const schemaResponse = await fetch('/api/schema')

        if (!schemaResponse.ok) {
          throw new Error(`Schema API returned status ${schemaResponse.status}`);
        }

        const schemaData = await schemaResponse.json()
        console.log("Schema data:", schemaData);

        if (schemaData.error) {
          throw new Error(schemaData.error);
        }

        if (Array.isArray(schemaData)) {
          setTables(schemaData)

          // Step 3: Then fetch the first table's data if needed
          if (schemaData.length > 0 && !selectedTable) {
            const firstTable = schemaData[0].name;
            setSelectedTable(firstTable)

            // Wait a bit to ensure previous request is done
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(`Fetching data for first table: ${firstTable}...`);
            const tableResponse = await fetch(`/api/tables?table=${firstTable}&limit=100`)

            if (!tableResponse.ok) {
              throw new Error(`Table data API returned status ${tableResponse.status}`);
            }

            const tableData = await tableResponse.json()
            console.log("Table data:", tableData);

            if (tableData.error) {
              throw new Error(tableData.error);
            }

            if (Array.isArray(tableData)) {
              setTableData(tableData)
            } else {
              console.error("Table data is not an array:", tableData);
            }
          }
        } else {
          console.error("Schema data is not an array:", schemaData);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch schema data
  const fetchSchema = async () => {
    // Don't allow fetching schema while we're already loading data
    if (isLoading) {
      console.log("Already loading data, skipping schema fetch");
      return;
    }

    try {
      setIsLoading(true)
      console.log("Refreshing schema data...");

      // Add a small delay to ensure previous requests are complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch('/api/schema')

      if (!response.ok) {
        throw new Error(`Schema API returned status ${response.status}`);
      }

      const data = await response.json()
      console.log("Schema refresh data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data)) {
        setTables(data)

        // Only fetch table data if we have a selected table
        // but don't auto-select a new table if none is selected
        if (selectedTable) {
          // Add a small delay to ensure schema update is processed
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchTableData(selectedTable)
        }
      } else {
        console.error("Schema data is not an array:", data);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch table data when a table is selected
  const fetchTableData = async (tableName: string) => {
    // Don't allow fetching if we're already loading
    if (isLoading) {
      console.log(`Already loading, skipping data fetch for ${tableName}`);
      return;
    }

    try {
      setIsLoading(true)
      console.log(`Fetching data for table: ${tableName}...`);

      // Add a small delay to ensure previous requests are complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`/api/tables?table=${tableName}&limit=100`)

      if (!response.ok) {
        throw new Error(`Table data API returned status ${response.status}`);
      }

      const data = await response.json()
      console.log(`Table data for ${tableName}:`, data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data)) {
        setTableData(data)
      } else {
        console.error(`Table data for ${tableName} is not an array:`, data);
      }
    } catch (error) {
      console.error(`Failed to fetch data for table ${tableName}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    // Skip if we're already on this table or loading
    if (tableName === selectedTable || isLoading) {
      return;
    }

    setSelectedTable(tableName)
    fetchTableData(tableName)

    // Update the SQL query template to match the selected table
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 10;`)
  }

  // Execute a custom SQL query
  const executeQuery = async () => {
    // Don't allow executing a query if we're already loading
    if (isLoading) {
      console.log("Already loading, skipping query execution");
      return;
    }

    try {
      setIsLoading(true)
      setQueryError(null)

      console.log("Executing SQL query...");
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: sqlQuery }),
      })

      const data = await response.json()

      if (data.error) {
        console.log("Query returned an error:", data.error);
        setQueryError(data.error)
        setQueryResults([])
        setQueryFields([])
      } else {
        console.log(`Query successful, returned ${data.rows?.length || 0} rows`);
        setQueryResults(data.rows || [])
        setQueryFields(data.fields || [])
        // toast({
        //   title: "Query executed",
        //   description: `Returned ${data.rows?.length || 0} rows`,
        // })
      }
    } catch (error) {
      const err = error as Error;
      console.error('Failed to execute query:', err)
      setQueryError(err.message || 'Failed to execute query')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh the current table data
  const refreshTableData = () => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }

  // Refresh the entire schema
  const refreshSchema = () => {
    fetchSchema()
  }

  // Add row handlers
  const handleAddRow = () => {
    // Reset form state
    setFormData({});
    setFormError(null);
    setShowAddModal(true);
  }

  // Edit row handlers
  const handleEditRow = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setFormData({...row});
    setFormError(null);
    setShowEditModal(true);
  }

  // Delete row handler
  const handleDeleteRow = async (row: Record<string, unknown>) => {
    if (!selectedTable) return;

    // Find primary key column
    const tableInfo = tables.find(t => t.name === selectedTable);
    const primaryKeyCol = tableInfo?.columns.find(c => c.primaryKey);

    if (!primaryKeyCol) {
      alert("Cannot delete row: No primary key found for this table");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this row from ${selectedTable}?`)) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/data?table=${selectedTable}&primaryKey=${primaryKeyCol.name}&primaryKeyValue=${row[primaryKeyCol.name]}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete row');
      }

      // Refresh table data after deletion
      fetchTableData(selectedTable);

    } catch (error) {
      const err = error as Error;
      console.error('Failed to delete row:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Form change handler
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTable) return;

    try {
      setIsLoading(true);
      setFormError(null);

      if (showAddModal) {
        // Adding a new row
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableName: selectedTable,
            data: formData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add row');
        }

        // Close modal and refresh table data
        setShowAddModal(false);
        setFormData({});
        fetchTableData(selectedTable);

      } else if (showEditModal && editingRow) {
        // Editing an existing row
        const tableInfo = tables.find(t => t.name === selectedTable);
        const primaryKeyCol = tableInfo?.columns.find(c => c.primaryKey);

        if (!primaryKeyCol) {
          throw new Error('No primary key found for this table');
        }

        const response = await fetch('/api/data', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableName: selectedTable,
            data: formData,
            primaryKey: primaryKeyCol.name,
            primaryKeyValue: editingRow[primaryKeyCol.name],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update row');
        }

        // Close modal and refresh table data
        setShowEditModal(false);
        setEditingRow(null);
        setFormData({});
        fetchTableData(selectedTable);
      }

    } catch (error) {
      const err = error as Error;
      console.error('Form submission error:', err);
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Local-PG Studio</h1>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected 
              ? `Connected to ${connectionInfo?.database}@${connectionInfo?.host}:${connectionInfo?.port}` 
              : "Disconnected"}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="p-4 border-b">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={refreshSchema}
              disabled={isLoading || !isConnected}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Schema
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : !isConnected ? (
                <div className="text-center py-4 text-muted-foreground">
                  Not connected to database
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No tables found
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">TABLES</h3>
                  {filteredTables.map((table) => (
                    <div
                      key={table.name}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTable === table.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                      onClick={() => handleTableSelect(table.name)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{table.name}</span>
                      </div>
                      <div className="text-xs opacity-70">
                        {table.columns.length} columns • {table.rowCount.toLocaleString()} rows
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="data" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="query">Query</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="data" className="h-full m-0 p-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTable || "No Table Selected"}</CardTitle>
                        <CardDescription>
                          {tables.find((t) => t.name === selectedTable)?.rowCount.toLocaleString() || 0} total rows
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!selectedTable || isLoading || !isConnected}
                          onClick={() => handleAddRow()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Row
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={refreshTableData}
                          disabled={!selectedTable || isLoading || !isConnected}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : !selectedTable ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Select a table to view its data
                      </div>
                    ) : tableData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No data found in this table
                      </div>
                    ) : (
                      <div className="border rounded-lg m-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                {Object.keys(tableData[0] || {}).map((columnName) => {
                                  const column = tables
                                    .find((t) => t.name === selectedTable)
                                    ?.columns.find((c) => c.name === columnName);
                                  
                                  return (
                                    <th key={columnName} className="text-left p-3 font-medium text-sm">
                                      <div className="flex items-center gap-2">
                                        {columnName}
                                        {column?.primaryKey && (
                                          <Badge variant="secondary" className="text-xs">
                                            PK
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground font-normal">
                                        {column?.type || ""}
                                      </div>
                                    </th>
                                  );
                                })}
                                <th className="w-20 p-3"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.map((row, rowIndex) => {
                                // Create a unique key for each row using its index and a possible primary key value if available
                                const primaryKeyCol = tables
                                  .find((t) => t.name === selectedTable)
                                  ?.columns.find((c) => c.primaryKey)?.name;

                                const rowKey = primaryKeyCol && row[primaryKeyCol]
                                  ? `row-${row[primaryKeyCol]}`
                                  : `row-index-${rowIndex}`;

                                return (
                                  <tr key={rowKey} className="border-t hover:bg-muted/30">
                                    {Object.entries(row).map(([key, value]) => (
                                      <td key={`${rowKey}-cell-${key}`} className="p-3 text-sm">
                                        {value === null ? (
                                          <span className="text-muted-foreground italic">NULL</span>
                                        ) : typeof value === "boolean" ? (
                                          <Badge variant={value ? "default" : "secondary"}>{value.toString()}</Badge>
                                        ) : (
                                          String(value)
                                        )}
                                      </td>
                                    ))}
                                    <td className="p-3">
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          disabled={!isConnected}
                                          onClick={() => handleEditRow(row)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-destructive"
                                          disabled={!isConnected}
                                          onClick={() => handleDeleteRow(row)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema" className="h-full m-0 p-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Table Schema: {selectedTable || "No Table Selected"}</CardTitle>
                    <CardDescription>Column definitions and constraints</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : !selectedTable ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Select a table to view its schema
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tables
                          .find((t) => t.name === selectedTable)
                          ?.columns.map((column) => (
                            <div key={column.name} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{column.name}</span>
                                  {column.primaryKey && <Badge>Primary Key</Badge>}
                                  {!column.nullable && <Badge variant="outline">NOT NULL</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground">{column.type}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="query" className="h-full m-0 p-4 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>SQL Query Editor</CardTitle>
                    <CardDescription>Write and execute SQL queries</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Query</Label>
                      <Textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="Enter your SQL query..."
                        className="font-mono text-sm min-h-[120px]"
                        disabled={!isConnected}
                      />
                    </div>
                    <Button 
                      onClick={executeQuery} 
                      className="flex items-center gap-2"
                      disabled={!sqlQuery || isLoading || !isConnected}
                    >
                      <Play className="w-4 h-4" />
                      Execute Query
                    </Button>
                  </CardContent>
                </Card>

                {queryError && (
                  <Card className="border-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-destructive">Query Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-destructive">{queryError}</p>
                    </CardContent>
                  </Card>
                )}

                {queryResults.length > 0 && (
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle>Query Results</CardTitle>
                      <CardDescription>{queryResults.length} rows returned</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              {queryFields.map((field) => (
                                <th key={field.name} className="text-left p-3 font-medium text-sm">
                                  {field.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResults.map((row, rowIndex) => {
                              // Create a unique row key for query results
                              const rowKey = `query-row-${rowIndex}`;

                              return (
                                <tr key={rowKey} className="border-t">
                                  {Object.entries(row).map(([key, value]) => (
                                    <td key={`${rowKey}-cell-${key}`} className="p-3 text-sm">
                                      {value === null ? (
                                        <span className="text-muted-foreground italic">NULL</span>
                                      ) : typeof value === "boolean" ? (
                                        <Badge variant={value ? "default" : "secondary"}>{value.toString()}</Badge>
                                      ) : (
                                        String(value)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      {/* Add Row Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add New Row to {selectedTable}</h3>

            {formError && (
              <div className="bg-destructive/20 text-destructive text-sm p-3 rounded-md mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {tables
                  .find(t => t.name === selectedTable)?.columns
                  .map(column => (
                    <div key={column.name} className="space-y-2">
                      <Label htmlFor={column.name} className="flex items-center gap-2">
                        {column.name}
                        {column.primaryKey && <Badge variant="outline" className="text-xs">PK</Badge>}
                        {!column.nullable && <Badge variant="outline" className="text-xs">Required</Badge>}
                      </Label>
                      <Input
                        id={column.name}
                        name={column.name}
                        value={formData[column.name] || ''}
                        onChange={handleFormChange}
                        placeholder={column.type}
                        disabled={column.primaryKey && column.type.includes('SERIAL')}
                        required={!column.nullable && !column.primaryKey}
                      />
                      <p className="text-xs text-muted-foreground">{column.type}</p>
                    </div>
                  ))
                }
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Row Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Row in {selectedTable}</h3>

            {formError && (
              <div className="bg-destructive/20 text-destructive text-sm p-3 rounded-md mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {tables
                  .find(t => t.name === selectedTable)?.columns
                  .map(column => (
                    <div key={column.name} className="space-y-2">
                      <Label htmlFor={column.name} className="flex items-center gap-2">
                        {column.name}
                        {column.primaryKey && <Badge variant="outline" className="text-xs">PK</Badge>}
                        {!column.nullable && <Badge variant="outline" className="text-xs">Required</Badge>}
                      </Label>
                      <Input
                        id={column.name}
                        name={column.name}
                        value={formData[column.name] !== undefined ? formData[column.name] : ''}
                        onChange={handleFormChange}
                        placeholder={column.type}
                        disabled={column.primaryKey}
                        required={!column.nullable && !column.primaryKey}
                      />
                      <p className="text-xs text-muted-foreground">{column.type}</p>
                    </div>
                  ))
                }
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRow(null);
                    setFormData({});
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}