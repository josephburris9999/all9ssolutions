#!/usr/bin/env node
/**
 * Create a pending ProjectAgreement for a client project.
 *
 * Usage:
 *   npm run db:create-project-agreement -- --project-id=abc123 --title="Phase 2 SOW"
 *   npm run db:create-project-agreement -- --email=client@example.com --title="Addendum"
 *   npm run db:create-project-agreement -- --email=client@example.com --consultation-id=xyz --title="Addendum"
 *
 * Options:
 *   --project-id=<id>         Project id (required unless --email resolves to one project)
 *   --email=<address>         Client email; uses linked Project row(s)
 *   --consultation-id=<id>    Disambiguate when email has multiple projects
 *   --title=<text>            Agreement title shown in the portal (required)
 *   --body=<text>             Agreement body text (required)
 *   --body-file=<path>        Read agreement body from a file instead of --body
 *   --version=<version>       Document version (default: 2026-05-31)
 *   --dry-run                 Print planned insert without writing
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createPgClient } from './lib/pg-client.mjs';

const DEFAULT_VERSION = '2026-05-31';

function parseArgs(argv) {
  const options = {
    projectId: '',
    email: '',
    consultationId: '',
    title: '',
    body: '',
    bodyFile: '',
    version: DEFAULT_VERSION,
    dryRun: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--project-id=')) options.projectId = arg.slice('--project-id='.length).trim();
    else if (arg.startsWith('--email=')) options.email = arg.slice('--email='.length).trim();
    else if (arg.startsWith('--consultation-id=')) {
      options.consultationId = arg.slice('--consultation-id='.length).trim();
    } else if (arg.startsWith('--title=')) options.title = arg.slice('--title='.length).trim();
    else if (arg.startsWith('--body=')) options.body = arg.slice('--body='.length);
    else if (arg.startsWith('--body-file=')) options.bodyFile = arg.slice('--body-file='.length).trim();
    else if (arg.startsWith('--version=')) options.version = arg.slice('--version='.length).trim();
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Create a pending ProjectAgreement for a client project.

Options:
  --project-id=<id>         Project id
  --email=<address>         Resolve project via ConsultationRequest email
  --consultation-id=<id>    Pick project when email matches multiple
  --title=<text>            Agreement title (required)
  --body=<text>             Agreement body text (required unless --body-file)
  --body-file=<path>        Read agreement body from a file
  --version=<version>       Document version (default ${DEFAULT_VERSION})
  --dry-run                 Print without inserting
  --help, -h                Show this help

Examples:
  npm run db:create-project-agreement -- --project-id=clxyz --title="Phase 2 Agreement"
  npm run db:create-project-agreement -- --email=client@example.com --title="SOW Addendum"

Requires DIRECT_URL or DATABASE_URL.
`);
}

async function listProjectsForEmail(client, email) {
  const result = await client.query(
    `SELECT p.id, p.title, cr.id AS "consultationId", cr.email
     FROM "Project" p
     INNER JOIN "ConsultationRequest" cr ON cr.id = p."consultationRequestId"
     WHERE lower(trim(cr.email)) = lower(trim($1))
     ORDER BY p."createdAt" ASC`,
    [email]
  );
  return result.rows;
}

async function findProjectById(client, projectId) {
  const result = await client.query(
    `SELECT p.id, p.title, cr.email
     FROM "Project" p
     INNER JOIN "ConsultationRequest" cr ON cr.id = p."consultationRequestId"
     WHERE p.id = $1`,
    [projectId]
  );
  return result.rows[0] ?? null;
}

async function resolveProject(client, options) {
  if (options.projectId) {
    const project = await findProjectById(client, options.projectId);
    if (!project) {
      throw new Error(`No Project found with id ${options.projectId}`);
    }
    return project;
  }

  if (!options.email) {
    throw new Error('Provide --project-id or --email');
  }

  const projects = await listProjectsForEmail(client, options.email);
  if (projects.length === 0) {
    throw new Error(`No Project found for email ${options.email}`);
  }

  if (options.consultationId) {
    const match = projects.find((row) => row.consultationId === options.consultationId);
    if (!match) {
      throw new Error(
        `No Project linked to consultation ${options.consultationId} for email ${options.email}`
      );
    }
    return match;
  }

  if (projects.length > 1) {
    console.error('Multiple projects found for this email. Use --project-id or --consultation-id:\n');
    for (const row of projects) {
      console.error(`  project ${row.id}  consultation ${row.consultationId}  ${row.title}`);
    }
    throw new Error('Ambiguous project; pass --project-id or --consultation-id');
  }

  return projects[0];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.title) {
    throw new Error('--title is required');
  }

  let body = options.body;
  if (options.bodyFile) {
    body = await readFile(options.bodyFile, 'utf8');
  }
  if (!body.trim()) {
    throw new Error('--body or --body-file is required');
  }

  const client = await createPgClient();

  try {
    const project = await resolveProject(client, options);

    console.log('Project:', project.id, project.title);
    console.log('Title:', options.title);
    console.log('Document version:', options.version);

    if (options.dryRun) {
      console.log('Dry run — no row inserted.');
      return;
    }

    const insert = await client.query(
      `INSERT INTO "ProjectAgreement" ("projectId", title, body, "documentVersion", status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id, "projectId", title, body, "documentVersion", status, "createdAt"`,
      [project.id, options.title, body.trim(), options.version]
    );

    const row = insert.rows[0];
    console.log('Created ProjectAgreement:', row.id);
    console.log(JSON.stringify(row, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
