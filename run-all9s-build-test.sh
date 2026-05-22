#!/usr/bin/env bash
set -uo pipefail
LOG=/tmp/all9s-build-test.log
cd /home/joseph/workspaces/all9s/all9ssolutions
: > "$LOG"
{
  echo "=== npm install -D vitest ==="
  npm install -D vitest
  echo ""
  echo "INSTALL_EXIT_CODE=$?"
  echo ""
  echo "=== npm run build ==="
  npm run build
  echo ""
  echo "BUILD_EXIT_CODE=$?"
} >> "$LOG" 2>&1
