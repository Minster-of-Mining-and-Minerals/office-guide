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
  # Seeders run on every start. They are all NON-DESTRUCTIVE (insert only
  # what is missing, never delete), so existing admin edits are preserved
  # while a fresh database still gets floors, offices, roles and an admin.
  echo "🌱 Running database seeders..."
  if npx sequelize-cli db:seed:all; then
    echo "✅ Database seeders applied successfully."
  else
    echo "⚠️ Seeder warning: db:seed:all exited with non-zero status"
  fi
fi

echo "✅ Starting backend server..."
exec "$@"