// Database schema types
export interface ColumnInfo {
  name: string;
  type: string;
  primaryKey: boolean;
  nullable: boolean;
  defaultValue?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ConnectionInfo {
  host: string;
  port: number;
  database: string;
  user: string;
  connected: boolean;
}

export interface QueryField {
  name: string;
  dataTypeID: number;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: QueryField[];
  error?: string;
  detail?: string;
  position?: string;
}

export interface ConnectionOptions {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  connectionTimeoutMillis?: number;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  position?: string;
  connected?: boolean;
  success?: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
  connection?: ConnectionInfo;
  deletedRow?: Record<string, unknown>;
}