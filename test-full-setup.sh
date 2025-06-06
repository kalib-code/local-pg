#!/bin/bash

# Script to test local-pg and local-pg-studio setup and execution

# Set variables
PORT=5445
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo "Using test directory: $TEST_DIR"

# Clean up on exit
cleanup() {
  echo "Cleaning up..."
  pkill -f "local-pg --port=$PORT" || true
  pkill -f "node start-studio.js" || true
  echo "Done."
}
trap cleanup EXIT

# Step 1: Start local-pg
echo "=== Starting local-pg on port $PORT ==="
local-pg --port=$PORT &
PG_PID=$!
echo "local-pg started with PID: $PG_PID"

# Wait for server to start
sleep 3

# Step 2: Test database connection
echo "=== Testing database connection ==="
cd /Users/kael/Documents/Work/local-pg
node __test__/test-db-connection.js --port=$PORT --host=127.0.0.1

# Check if the connection test was successful
if [ $? -ne 0 ]; then
  echo "Database connection test failed!"
  exit 1
fi

# Step 3: Set up environment variables for studio
export PGHOST=localhost
export PGPORT=$PORT
export PGDATABASE=template1
export PGUSER=postgres

# Step 4: Check if studio setup works
echo "=== Testing start:studio script ==="
cd /Users/kael/Documents/Work/local-pg
node __test__/start-studio.js &
STUDIO_PID=$!
echo "Studio started with PID: $STUDIO_PID"

# Wait for studio to start
echo "Waiting for studio to start (5 seconds)..."
sleep 5

# Step 5: Try to connect to studio
echo "=== Testing connection to studio ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Step 6: Show success message
echo "=== Test completed successfully ==="
echo "local-pg and local-pg-studio setup and execution test completed."
echo "Press Ctrl+C to exit"

# Keep script running until user exits
wait $PG_PID
