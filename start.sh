#!/usr/bin/env bash
set -e

# ─── Load Upstash Redis config ──────────────────────────────────────────────
export KV_REST_API_URL="https://immune-calf-107470.upstash.io"
export KV_REST_API_TOKEN="gQAAAAAAAaPOAAIgcDEyNjVhZDIyZjFmZDA0ZDZmOWNiNWE3N2QyNDU5MjVmZg"

# ─── Prisma/DB setup (optional — if you add auth later) ─────────────────────
# export DATABASE_URL="postgresql://user:pass@localhost:5432/veracar?schema=public"

# ─── Start Next.js (port 3000) ─────────────────────────────────────────────
cd "$(dirname "$0")"
exec npm start
