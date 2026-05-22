#!/usr/bin/env bash
cd /home/joseph/workspaces/all9s/all9ssolutions || exit 1
exec > test-run-output.txt 2>&1
echo "=== Started ==="
echo "PWD=$(pwd)"
NVM_EXIT=0
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  echo "=== nvm use 22 ==="
  nvm use 22 || NVM_EXIT=$?
  echo "nvm use 22 exit code: $NVM_EXIT"
else
  echo "=== nvm not found ==="
fi
node -v || true
npm -v || true
echo "=== npm install ==="
npm install
EXIT_INSTALL=$?
echo "npm install exit code: $EXIT_INSTALL"
echo "=== npm run typecheck ==="
npm run typecheck
EXIT_TYPECHECK=$?
echo "npm run typecheck exit code: $EXIT_TYPECHECK"
echo "=== Summary ==="
echo "nvm use 22: $NVM_EXIT"
echo "npm install: $EXIT_INSTALL"
echo "npm run typecheck: $EXIT_TYPECHECK"
echo "=== Finished ==="
