#!/usr/bin/env bash
# Start local db + api with Firebase Admin secrets from the Phantom vault.
# Do not use `phantom exec -- docker compose` for this stack: exec replaces
# FIREBASE_* with phm_ session tokens, and the Admin SDK cannot verify ID tokens.
#
# FIREBASE_PRIVATE_KEY must be stored as one line (newlines as \n). Phantom
# `add --stdin` and Compose both stop at the first real newline. The API
# Settings validator turns \n sequences back into a PEM.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v phantom >/dev/null 2>&1; then
  echo "error: phantom CLI not found. Install: npm i -g phantom-secrets" >&2
  exit 1
fi

export FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY
FIREBASE_PROJECT_ID="$(phantom reveal FIREBASE_PROJECT_ID --yes | tr -d '\n')"
FIREBASE_CLIENT_EMAIL="$(phantom reveal FIREBASE_CLIENT_EMAIL --yes | tr -d '\n')"
FIREBASE_PRIVATE_KEY="$(phantom reveal FIREBASE_PRIVATE_KEY --yes | tr -d '\n')"

docker compose up "$@"
