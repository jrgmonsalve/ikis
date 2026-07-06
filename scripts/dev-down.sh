#!/usr/bin/env bash
set -euo pipefail

PID_FILE="/tmp/ikis-dev.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No dev environment PID file found ($PID_FILE) — nothing to stop."
  exit 0
fi

PID="$(cat "$PID_FILE")"

if kill -0 -- "-$PID" 2>/dev/null; then
  kill -TERM -- "-$PID" 2>/dev/null || true
  sleep 1
  kill -KILL -- "-$PID" 2>/dev/null || true
  echo "Stopped dev environment (process group $PID)."
else
  echo "Process group $PID is not running."
fi

rm -f "$PID_FILE"
