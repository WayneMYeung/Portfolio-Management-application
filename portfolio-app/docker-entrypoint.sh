#!/bin/sh
# docker-entrypoint.sh
# Runs DB migrations then starts the app

set -e

echo "🚀 Starting Portfolio Manager..."

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed if DB is new (first run)
if [ ! -f "/app/data/.seeded" ]; then
  echo "🌱 Running initial seed..."
  npx tsx prisma/seed.ts 2>/dev/null || echo "⚠️  Seed failed (may already be seeded)"
  touch /app/data/.seeded
fi

echo "✅ Ready! Starting Next.js server..."
exec node server.js
