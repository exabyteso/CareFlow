#!/usr/bin/env bash
# Render build for careflow-web (Next.js 15 PWA).
# Invoked from the repository root (render.yaml buildCommand: ./build.sh).
# Do not set rootDir: frontend — files outside that directory are unavailable
# at build time, so this script would not be in the build context.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f frontend/package.json ]]; then
  echo "error: frontend/package.json not found; run from the CareFlow repository root" >&2
  exit 1
fi

cd frontend
npm ci
npm run build
