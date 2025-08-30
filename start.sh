#!/bin/sh

# Start the backend server in the background
echo "Starting backend server..."
cd /app/backend && PORT=3000 node dist/server.js &
BACKEND_PID=$!

# Wait and check if backend started successfully
sleep 5

# Check if backend process is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend failed to start!"
    exit 1
fi

echo "Backend started successfully (PID: $BACKEND_PID)"

# Start nginx in the foreground
echo "Starting nginx..."
exec nginx -g "daemon off;"
