#!/bin/bash
cd "frontend"
PORT=3000

# Find exact node processes on port 3000
PIDS=$(lsof -i tcp:$PORT -sTCP:LISTEN -nP | grep "node" | awk '{print $2}' | sort -u)

if [ ! -z "$PIDS" ]; then
  echo "Killing Node.js processes on port $PORT: $PIDS"
  for PID in $PIDS; do
    kill -9 "$PID"
  done
fi

echo "Starting frontend on http://127.0.0.1:$PORT..."
BROWSER=none npm start
