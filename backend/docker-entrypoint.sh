#!/bin/sh
# docker-entrypoint.sh — Minister Of Mines Office Guide backend
set -e

echo "⏳ Running database migrations..."
if npx sequelize-cli db:migrate; then
  echo "✅ Database migrations applied successfully."
else
  echo "⚠️ Migration warning: db:migrate exited with non-zero status"
fi

if [ "$RUN_DB_SEEDERS" = "true" ]; then
  echo "🌱 Running database seeders..."
  npx sequelize-cli db:seed:all || true
  npx sequelize-cli db:seed --seed 20260716230000-real-roles-and-admin.js
  echo "✅ Database seeders applied successfully."
fi

echo "✅ Starting backend server..."
exec "$@"