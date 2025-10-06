#!/bin/sh
set -e

# Wait for Postgres to be ready
echo "Waiting for postgres at $DATABASE_URL ..."
# Extract host and port; fallback to localhost:5432 if DATABASE_URL not supplied
# A simple loop that tries to connect using pg_isready if available, else netcat
TRY=0
MAX_TRIES=30
while true; do
  # Try using pg_isready if installed
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" >/dev/null 2>&1 && break
  else
    # fallback: try /dev/tcp
    host="${POSTGRES_HOST:-db}"
    port="${POSTGRES_PORT:-5432}"
    (echo > /dev/tcp/"$host"/"$port") >/dev/null 2>&1 && break
  fi

  TRY=$((TRY + 1))
  if [ "$TRY" -ge "$MAX_TRIES" ]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
  echo "Postgres not ready yet. try $TRY/$MAX_TRIES — sleeping 2s"
  sleep 2
done

echo "Postgres is ready."

# Ensure prisma client is generated
echo "Running: pnpm exec prisma generate"
pnpm exec prisma generate

# Apply migrations (development)
# Use migrate dev to create migrations from schema if missing and apply them.
# We supply a default name "init" if migrations folder is empty.
echo "Applying Prisma migrations (dev)..."
# Non-zero exit here should stop the container
pnpm exec prisma migrate dev --name init --skip-seed

# Start Next.js (dev). For production, you might run pnpm start (after build)
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting production server"
  pnpm run build
  pnpm run start
else
  echo "Starting dev server"
  pnpm run dev
fi
