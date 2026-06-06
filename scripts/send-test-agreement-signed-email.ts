/**
 * Send a test Client Service Agreement signed confirmation email via Resend.
 *
 * Usage:
 *   npx tsx scripts/send-test-agreement-signed-email.ts
 *   node scripts/send-test-agreement-signed-email.mjs
 *
 *   TEST_AGREEMENT_EMAIL_TO=you@example.com npx tsx scripts/send-test-agreement-signed-email.ts
 *   INCLUDE_PROJECT_CREATION_NOTICE=true npx tsx scripts/send-test-agreement-signed-email.ts
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
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildClientAgreementSignedEmail,
  CLIENT_AGREEMENT_PDF_FILENAME,
} from '../src/lib/portal-agreement-signed-email';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatSignedAtLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    console.error('RESEND_API_KEY and CONSULTATION_CONFIRMATION_FROM are required.');
    process.exit(1);
  }

  const to =
    process.env.TEST_AGREEMENT_EMAIL_TO?.trim() ||
    process.env.CONSULTATION_REPLY_TO?.trim() ||
    from;

  const name = (process.env.TEST_AGREEMENT_NAME ?? 'Portal Test Client').trim();
  const signerName = (process.env.TEST_AGREEMENT_SIGNER_NAME ?? name).trim();
  const signedAtLabel =
    process.env.TEST_AGREEMENT_SIGNED_AT?.trim() || formatSignedAtLabel(new Date());
  const includeProjectCreationNotice =
    (process.env.INCLUDE_PROJECT_CREATION_NOTICE ?? 'true').trim().toLowerCase() !== 'false';

  const pdfPath = join(__dirname, '..', 'public', 'sample-agreement.pdf');
  let pdf: Buffer;
  try {
    pdf = await readFile(pdfPath);
  } catch {
    pdf = Buffer.from('%PDF-1.4\n% Test agreement attachment\n');
  }

  const { subject, html, text } = buildClientAgreementSignedEmail({
    name,
    signerName,
    signedAtLabel,
    includeProjectCreationNotice,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[TEST] ${subject}`,
      html,
      text,
      reply_to: process.env.CONSULTATION_REPLY_TO?.trim() || undefined,
      attachments: [
        {
          filename: CLIENT_AGREEMENT_PDF_FILENAME,
          content: pdf.toString('base64'),
        },
      ],
    }),
  });

  const body = (await res.json()) as { message?: string; id?: string };

  if (!res.ok) {
    console.error('Resend error:', body.message ?? res.status);
    process.exit(1);
  }

  console.log(`Sent test agreement signed email to ${to} (id: ${body.id ?? 'unknown'})`);
  console.log(
    `includeProjectCreationNotice=${includeProjectCreationNotice ? 'true' : 'false'}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
