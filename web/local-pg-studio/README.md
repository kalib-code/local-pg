# Local PG Studio

A web-based PostgreSQL client interface for Local PG.

## Features

- Browse database schema
- View and edit table data
- Execute custom SQL queries
- Real-time connection to Local PG

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Local PG running on your machine

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file with the following content:

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=mydb
PGUSER=postgres
```

### Development

Start the development server:

```bash
npm run dev
```

### Production Build

Build and start the production server:

```bash
npm run build
npm run start
```

## Usage with Local PG

1. Start Local PG:

```bash
npx local-pg
```

2. In another terminal, start Local PG Studio:

```bash
cd web/local-pg-studio
npm run dev
```

3. Open your browser at http://localhost:3000

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To learn more about Local PG, visit:
- [Local PG GitHub Repository](https://github.com/kalib-code/local-pg)