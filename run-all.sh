#!/bin/bash
cd /home/joseph/workspaces/all9s/all9ssolutions
exec > test-run-output.txt 2>&1
echo "=== Step 1: Node version ==="
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 22 2>/dev/null || nvm use 20 2>/dev/null || true
fi
node -v
NODE_VER=$(node -v 2>/dev/null || echo none)
echo "NODE_VERSION_RAW=$NODE_VER"
MAJOR=$(echo "$NODE_VER" | sed -n 's/^v\([0-9]*\).*/\1/p')
if [ -n "$MAJOR" ] && [ "$MAJOR" -ge 20 ] 2>/dev/null; then
  echo "=== Node 20+ available — proceeding ==="
  echo "=== npm install ==="
  npm install
  echo "NPM_INSTALL_EXIT=$?"
  echo "=== npm run test:run ==="
  npm run test:run
  echo "TEST_EXIT=$?"
  echo "=== npm run build ==="
  npm run build
  echo "BUILD_EXIT=$?"
else
  echo "=== Node 20+ NOT available — skipping npm install/test/build ==="
  echo "NPM_INSTALL_EXIT=skipped"
  echo "TEST_EXIT=skipped"
  echo "BUILD_EXIT=skipped"
fi
echo "=== Done ==="
