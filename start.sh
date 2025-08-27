#!/bin/sh

# Start the backend server in the background
echo "Starting backend server..."
cd /app/backend && node dist/server.js &

# Wait a moment for backend to start
sleep 2

# Start nginx in the foreground
echo "Starting nginx..."
nginx -g "daemon off;"
