#!/bin/sh
set -e

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo "📦 Instalando dependencias..."
  npm ci
  cp package-lock.json node_modules/.package-lock.json 2>/dev/null || true
fi

exec "$@"
