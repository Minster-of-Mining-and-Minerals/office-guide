#!/bin/sh
# docker-entrypoint.sh — Minister Of Mines Office Guide backend
set -e

echo "⏳ Running database migrations..."
npx sequelize-cli db:migrate 2>&1 || echo "⚠️ Migration warning (non-fatal)"

if [ "$RUN_DB_SEEDERS" = "true" ]; then
  echo "🌱 Running database seeders..."
  npx sequelize-cli db:seed:all 2>&1 || echo "⚠️ Seeder warning (non-fatal)"
fi

echo "✅ Starting backend server..."
exec "$@"