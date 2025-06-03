# PG Web IDE

A web-based database IDE for local-pg. This application provides a user-friendly interface for interacting with your PostgreSQL database.

## Features

- Browse database tables
- Write and execute SQL queries
- View query results in a tabular format
- Error handling and feedback

## Development

### Prerequisites

- Node.js (v18+)
- npm

### Setup

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Build

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

## Usage

This web interface is automatically started when you run `local-pg`. It connects to the local PostgreSQL server using environment variables set by the local-pg CLI.

You can configure the web interface port using the `--web-port` option:

```bash
local-pg --web-port=8080
```

## Directory Structure

```
pgweb/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes for database operations
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout component
│   │   └── page.tsx      # Main page component
│   └── components/       # React components
│       ├── DbInterface.tsx     # Main database interface
│       ├── QueryEditor.tsx     # SQL query editor
│       ├── ResultsView.tsx     # Query results display
│       └── TableList.tsx       # Database table listing
├── public/              # Static assets
├── package.json         # Project dependencies
└── next.config.mjs      # Next.js configuration
```