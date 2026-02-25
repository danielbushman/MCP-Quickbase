#!/bin/sh

# Find and kill any process running on port 3536
PID=$(lsof -ti:3536)
if [ -n "$PID" ]; then
  echo "Killing process $PID using port 3536"
  kill $PID
  sleep 1
else
  echo "No process running on port 3536"
fi
