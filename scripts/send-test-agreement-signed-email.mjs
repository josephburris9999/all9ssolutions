#!/usr/bin/env node
/**
 * Send a test Client Service Agreement signed confirmation email via Resend.
 *
 * Usage:
 *   node scripts/send-test-agreement-signed-email.mjs
 *   TEST_AGREEMENT_EMAIL_TO=you@example.com node scripts/send-test-agreement-signed-email.mjs
 *   INCLUDE_PROJECT_CREATION_NOTICE=true node scripts/send-test-agreement-signed-email.mjs
 *
 * Required env:
 *   RESEND_API_KEY
 *   CONSULTATION_CONFIRMATION_FROM
 *
 * Optional env:
 *   TEST_AGREEMENT_EMAIL_TO (default: CONSULTATION_REPLY_TO or from address)
 *   TEST_AGREEMENT_NAME (default: Portal Test Client)
 *   TEST_AGREEMENT_SIGNER_NAME (default: same as name)
 *   TEST_AGREEMENT_SIGNED_AT (default: current local timestamp)
 *   INCLUDE_PROJECT_CREATION_NOTICE=true|false (default: true)
 *   CONSULTATION_REPLY_TO
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

execFileSync(
  'npx',
  ['--yes', 'tsx', join(__dirname, 'send-test-agreement-signed-email.ts'), ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  }
);
