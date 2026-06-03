import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { PortalAmountSummary } from '@/lib/portal-amount-due-data';

const ACTIVE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD'] as const;

type ProjectAmountRow = {
  depositAmount: number;
  amountDue: number;
  paidAmount: number;
};

function summarizeAmountRows(rows: ProjectAmountRow[]): PortalAmountSummary {
  return rows.reduce(
    (totals, row) => ({
      depositAmount: totals.depositAmount + Number(row.depositAmount),
      amountDue: totals.amountDue + Number(row.amountDue),
      paidAmount: totals.paidAmount + Number(row.paidAmount),
    }),
    { depositAmount: 0, amountDue: 0, paidAmount: 0 }
  );
}

/** Totals for deposit, due, and paid across active projects (unset/null counts as $0). */
export async function getPortalAmountSummary(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalAmountSummary> {
  const rows = projectId
    ? await prisma.$queryRaw<ProjectAmountRow[]>(Prisma.sql`
        SELECT
          COALESCE("depositAmount", 0)::float8 AS "depositAmount",
          COALESCE("amountDue", 0)::float8 AS "amountDue",
          COALESCE("paidAmount", 0)::float8 AS "paidAmount"
        FROM "Project"
        WHERE "portalUserId" = ${portalUserId}
          AND id = ${projectId}
      `)
    : await prisma.$queryRaw<ProjectAmountRow[]>(Prisma.sql`
        SELECT
          COALESCE("depositAmount", 0)::float8 AS "depositAmount",
          COALESCE("amountDue", 0)::float8 AS "amountDue",
          COALESCE("paidAmount", 0)::float8 AS "paidAmount"
        FROM "Project"
        WHERE "portalUserId" = ${portalUserId}
          AND "status"::text IN (${Prisma.join(ACTIVE_PROJECT_STATUSES)})
      `);

  return summarizeAmountRows(rows);
}
