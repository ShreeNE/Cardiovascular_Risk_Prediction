#!/bin/sh
set -e

echo "=========================================================="
echo " Starting CorVita Clinical CAD Assessment Suite on Render "
echo "=========================================================="

# 1. Start the FastAPI microservice on internal port 8000
echo "[1/2] Starting FastAPI ML inference backend on 127.0.0.1:8000..."
python3 -m uvicorn model.api:app --host 127.0.0.1 --port 8000 &

# 2. Wait for FastAPI to finish loading ML model artifacts
echo "Waiting for ML models and preprocessor to initialize..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "ML inference backend is healthy and ready!"
    break
  fi
  sleep 1
done

# 3. Start Next.js frontend binding to 0.0.0.0 on Render's external PORT
PORT_NUMBER="${PORT:-10000}"
export NODE_OPTIONS="--max-old-space-size=160"
echo "[2/2] Starting Next.js frontend on 0.0.0.0:${PORT_NUMBER}..."
cd /app/frontend
exec ./node_modules/.bin/next start -p "${PORT_NUMBER}" -H 0.0.0.0
