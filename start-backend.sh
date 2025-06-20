#!/bin/bash
cd "$(dirname "$0")"  # go to script directory
PORT=8001

# Kill process on port if already used
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
  echo "Killing process on port $PORT (PID $PID)..."
  kill -9 $PID
fi

# Start backend from project root, not inside backend/
echo "Starting backend on http://127.0.0.1:$PORT..."
uvicorn backend.api:app --reload --port $PORT
