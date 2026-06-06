#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npm --prefix functions run build
firebase emulators:start --only auth,firestore,functions &
EMULATORS_PID=$!

cleanup() {
  if kill -0 "$EMULATORS_PID" 2>/dev/null; then
    kill "$EMULATORS_PID"
    wait "$EMULATORS_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Waiting for Firebase emulators..."
for _ in {1..60}; do
  EMULATOR_STATUS="$(curl --silent --fail http://127.0.0.1:4400/emulators 2>/dev/null || true)"

  if [[ -n "$EMULATOR_STATUS" ]] &&
    printf '%s' "$EMULATOR_STATUS" | node -e "
      let input = '';
      process.stdin.on('data', chunk => input += chunk);
      process.stdin.on('end', () => {
        const data = JSON.parse(input);
        const ready = ['auth', 'firestore', 'functions'].every(name => data[name]);
        process.exit(ready ? 0 : 1);
      });
    " &&
    curl --silent --output /dev/null http://127.0.0.1:5001/ikis-5fed9/us-central1/createFamily; then
    echo "Firebase emulators are ready."
    sleep 2
    npm start
    exit $?
  fi

  sleep 1
done

echo "Firebase emulators did not become ready within 60 seconds." >&2
exit 1
