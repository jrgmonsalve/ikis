#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.local-runtime"
PID_FILE="$RUNTIME_DIR/dev.pid"
LOG_FILE="$RUNTIME_DIR/dev.log"

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$PID_FILE")"
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

start() {
  if is_running; then
    echo "IKIS local ya esta activo (PID $(cat "$PID_FILE"))."
    status
    return
  fi

  rm -f "$PID_FILE"
  mkdir -p "$RUNTIME_DIR"
  : > "$LOG_FILE"

  cd "$ROOT_DIR"
  nohup setsid bash scripts/dev.sh >>"$LOG_FILE" 2>&1 &
  local pid=$!
  printf '%s\n' "$pid" > "$PID_FILE"

  echo "Iniciando IKIS local (PID $pid)..."
  for _ in {1..90}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "El entorno no pudo iniciar. Ultimas lineas del log:" >&2
      tail -40 "$LOG_FILE" >&2
      rm -f "$PID_FILE"
      exit 1
    fi

    if curl --silent --fail --output /dev/null http://127.0.0.1:4200/ &&
      curl --silent --fail --output /dev/null http://127.0.0.1:4400/emulators; then
      echo "IKIS local esta listo."
      status
      return
    fi
    sleep 1
  done

  echo "El entorno no estuvo listo dentro de 90 segundos. Revisa: npm run local:logs" >&2
  exit 1
}

stop() {
  if ! is_running; then
    rm -f "$PID_FILE"
    echo "IKIS local no esta activo mediante el controlador."
    return
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  echo "Deteniendo IKIS local (PID $pid)..."
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true

  for _ in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      echo "IKIS local fue detenido."
      return
    fi
    sleep 1
  done

  kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "IKIS local fue detenido de forma forzada."
}

status() {
  if is_running; then
    echo "Estado: activo (PID $(cat "$PID_FILE"))"
    echo "Aplicacion: http://localhost:4200/"
    echo "Emuladores: http://localhost:4000/"
    echo "Log: $LOG_FILE"
  else
    rm -f "$PID_FILE"
    echo "Estado: detenido"
  fi
}

logs() {
  mkdir -p "$RUNTIME_DIR"
  touch "$LOG_FILE"
  tail -f "$LOG_FILE"
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  restart)
    stop
    start
    ;;
  status) status ;;
  logs) logs ;;
  *)
    echo "Uso: $0 {start|stop|restart|status|logs}" >&2
    exit 1
    ;;
esac
