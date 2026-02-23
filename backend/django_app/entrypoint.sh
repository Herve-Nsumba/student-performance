#!/bin/bash
set -e

echo "[entrypoint] Waiting for PostgreSQL..."
while ! python -c "
import socket, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
s.connect((os.environ.get('DB_HOST','postgres'), int(os.environ.get('DB_PORT','5432'))))
s.close()
" 2>/dev/null; do
  sleep 1
done
echo "[entrypoint] PostgreSQL is ready."

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

# Auto-seed demo data when DEBUG is on
if [ "${DJANGO_DEBUG}" = "True" ]; then
  echo "[entrypoint] Seeding demo data (DEBUG=True)..."
  python manage.py seed_demo
fi

echo "[entrypoint] Starting Gunicorn..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
