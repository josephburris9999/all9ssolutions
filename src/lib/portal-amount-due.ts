import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import {
  sumAmountDueLineItems,
  type PortalAmountDueLineItem,
  type PortalAmountSummary,
} from '@/lib/portal-amount-due-data';

const ACTIVE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD'] as const;

type ProjectTotalsRow = {
  depositAmount: number;
  paidAmount: number;
};

function mapLineItem(row: {
  id: string;
  amount: number;
  title: string;
}): PortalAmountDueLineItem {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.title,
  };
}

function summarizeTotals(rows: ProjectTotalsRow[], lineItems: PortalAmountDueLineItem[]): PortalAmountSummary {
  const depositAmount = rows.reduce((total, row) => total + Number(row.depositAmount), 0);
  const paidAmount = rows.reduce((total, row) => total + Number(row.paidAmount), 0);

  return {
    depositAmount,
    paidAmount,
    lineItems,
    amountDue: sumAmountDueLineItems(lineItems),
  };
}

async function listAmountDueLineItemsForProjects(projectIds: string[]): Promise<PortalAmountDueLineItem[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const rows = await prisma.projectAgreement.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      amount: true,
      title: true,
    },
  });

  return rows.map(mapLineItem);
}

/** Totals for deposit and paid on Project; due amounts from project agreements. */
export async function getPortalAmountSummary(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalAmountSummary> {
  const projectRows = projectId
    ? await prisma.$queryRaw<Array<{ id: string } & ProjectTotalsRow>>(Prisma.sql`
        SELECT
          id,
          COALESCE("depositAmount", 0)::float8 AS "depositAmount",
          COALESCE("paidAmount", 0)::float8 AS "paidAmount"
        FROM "Project"
        WHERE "portalUserId" = ${portalUserId}
          AND id = ${projectId}
      `)
    : await prisma.$queryRaw<Array<{ id: string } & ProjectTotalsRow>>(Prisma.sql`
        SELECT
          id,
          COALESCE("depositAmount", 0)::float8 AS "depositAmount",
          COALESCE("paidAmount", 0)::float8 AS "paidAmount"
        FROM "Project"
        WHERE "portalUserId" = ${portalUserId}
          AND "status"::text IN (${Prisma.join(ACTIVE_PROJECT_STATUSES)})
      `);

  const projectIds = projectRows.map((row) => row.id);
  const lineItems = await listAmountDueLineItemsForProjects(projectIds);

  return summarizeTotals(projectRows, lineItems);
}
