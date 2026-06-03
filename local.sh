#!/bin/bash

# ==============================================================================
# Script de Control de Servicios Locales - Ikis Expense Control
# ==============================================================================

# Cargar NVM si está disponible para usar la versión correcta de Node.js
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    # Intentar usar Node 22, si no, usar la versión por defecto
    nvm use 22 > /dev/null 2>&1 || nvm use default > /dev/null 2>&1
fi

# Puertos de la aplicación
BACKEND_PORT=3000
FRONTEND_PORT=4200

# Función para liberar puertos en caso de cuelgues
free_port() {
    PORT=$1
    PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo "   Liberando puerto $PORT (matando PID $PID)..."
        kill -9 $PID 2>/dev/null || true
    fi
}

start() {
    echo "=== Iniciando Servicios Locales ==="
    
    # 1. Levantar DynamoDB en Docker
    echo "1. Iniciando DynamoDB Local (Docker)..."
    docker compose up -d dynamodb-local
    
    echo "   Esperando a que DynamoDB esté listo..."
    sleep 3
    
    # 2. Configurar la tabla de DynamoDB
    echo "2. Configurando tabla de DynamoDB..."
    (cd backend && npm run local:setup)
    
    # 3. Levantar API Backend
    echo "3. Iniciando API Backend..."
    free_port $BACKEND_PORT
    
    nohup npm --prefix backend run local:api > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    echo "   API Backend iniciada (PID: $BACKEND_PID, logs en backend.log)"
    
    # 4. Levantar Angular Frontend
    echo "4. Iniciando Angular Frontend..."
    free_port $FRONTEND_PORT
    
    nohup npm --prefix frontend start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .frontend.pid
    echo "   Angular Frontend iniciado (PID: $FRONTEND_PID, logs en frontend.log)"
    
    echo "=========================================="
    echo "¡Servicios listos! Puedes acceder en:"
    echo "  - Frontend: http://localhost:$FRONTEND_PORT"
    echo "  - API Backend: http://localhost:$BACKEND_PORT"
    echo "  - DynamoDB Local: http://localhost:8001"
    echo "=========================================="
    echo "Para ver los logs en tiempo real:"
    echo "  - Backend:  ./local.sh logs backend"
    echo "  - Frontend: ./local.sh logs frontend"
    echo "=========================================="
}

stop() {
    echo "=== Deteniendo Servicios Locales ==="
    
    # Detener Frontend
    if [ -f .frontend.pid ]; then
        PID=$(cat .frontend.pid)
        echo "Deteniendo Angular Frontend (PID: $PID)..."
        pkill -P $PID 2>/dev/null || true
        kill $PID 2>/dev/null || true
        rm -f .frontend.pid
    fi
    free_port $FRONTEND_PORT
    
    # Detener Backend
    if [ -f .backend.pid ]; then
        PID=$(cat .backend.pid)
        echo "Deteniendo API Backend (PID: $PID)..."
        pkill -P $PID 2>/dev/null || true
        kill $PID 2>/dev/null || true
        rm -f .backend.pid
    fi
    free_port $BACKEND_PORT
    
    # Detener Docker
    echo "Deteniendo DynamoDB Local (Docker)..."
    docker compose down
    
    echo "=== Todos los servicios detenidos ==="
}

status() {
    echo "=== Estado de los Servicios Locales ==="
    
    # Docker
    if docker compose ps | grep -q "Up"; then
        echo " [OK] DynamoDB Local: Corriendo en Docker (Puerto 8001)"
    else
        echo " [X]  DynamoDB Local: Detenido"
    fi
    
    # Backend
    BACKEND_PID=$(lsof -t -i:$BACKEND_PORT)
    if [ ! -z "$BACKEND_PID" ]; then
        echo " [OK] API Backend: Corriendo (PID: $BACKEND_PID, Puerto: $BACKEND_PORT)"
    else
        echo " [X]  API Backend: Detenida"
    fi
    
    # Frontend
    FRONTEND_PID=$(lsof -t -i:$FRONTEND_PORT)
    if [ ! -z "$FRONTEND_PID" ]; then
        echo " [OK] Angular Frontend: Corriendo (PID: $FRONTEND_PID, Puerto: $FRONTEND_PORT)"
    else
        echo " [X]  Angular Frontend: Detenido"
    fi
}

logs() {
    SERVICE=$1
    if [ "$SERVICE" = "backend" ]; then
        echo "=== Logs de API Backend ==="
        tail -n 50 -f backend.log
    elif [ "$SERVICE" = "frontend" ]; then
        echo "=== Logs de Angular Frontend ==="
        tail -n 50 -f frontend.log
    else
        echo "Uso: ./local.sh logs [backend|frontend]"
    fi
}

# Evaluar el comando recibido
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    *)
        echo "Uso: ./local.sh {start|stop|restart|status|logs [backend|frontend]}"
        exit 1
        ;;
esac
