#!/usr/bin/env bash
set -euo pipefail
set -m

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/ikis-dev.pid"
LOG_FILE="/tmp/ikis-dev.log"

if [ -f "$PID_FILE" ] && kill -0 -- "-$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Dev environment already running (process group $(cat "$PID_FILE")). Run scripts/dev-down.sh first."
  exit 1
fi

cd "$ROOT_DIR"
pnpm dev > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "Dev environment starting (process group $(cat "$PID_FILE")). Logs: $LOG_FILE"
sleep 5
tail -n 20 "$LOG_FILE"
