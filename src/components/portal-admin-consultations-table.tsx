'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatPortalAdminConsultationTableDate,
  formatPortalAdminPreferredContact,
  getPortalAdminConsultationDetailPath,
  type PortalAdminConsultationClientRow,
} from '@/lib/portal-admin-client-display';
import { cn } from '@/lib/utils';
import { ConsultationEmailDeliveryBadge } from '@/components/consultation-email-delivery-badge';
import { PortalAdminTableNameEditIcon } from '@/components/portal-admin-table-name-edit-icon';

type PortalAdminConsultationsTableProps = {
  clients: PortalAdminConsultationClientRow[];
  emptyMessage: string;
};

type SortColumn = 'name' | 'preferredContact' | 'createdAt' | 'requestCount';
type SortDirection = 'asc' | 'desc';

type SortState = {
  column: SortColumn;
  direction: SortDirection;
};

const DEFAULT_SORT: SortState = {
  column: 'createdAt',
  direction: 'desc',
};

function compareRows(
  a: PortalAdminConsultationClientRow,
  b: PortalAdminConsultationClientRow,
  column: SortColumn
): number {
  switch (column) {
    case 'name':
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    case 'preferredContact':
      return a.preferredContact.localeCompare(b.preferredContact);
    case 'requestCount':
      return a.requestCount - b.requestCount;
    case 'createdAt':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
}

function sortRows(rows: PortalAdminConsultationClientRow[], sort: SortState): PortalAdminConsultationClientRow[] {
  const sorted = [...rows].sort((a, b) => compareRows(a, b, sort.column));
  return sort.direction === 'asc' ? sorted : sorted.reverse();
}

type SortableHeaderProps = {
  label: string;
  column: SortColumn;
  sort: SortState;
  onSort: (column: SortColumn) => void;
  className?: string;
};

function SortableHeader({ label, column, sort, onSort, className }: SortableHeaderProps) {
  const isActive = sort.column === column;
  const SortIcon = !isActive ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={cn('px-4 py-3 font-medium text-foreground', className)}
      aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-primary"
      >
        <span>{label}</span>
        <SortIcon
          className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
          aria-hidden
        />
      </button>
    </th>
  );
}

export function PortalAdminConsultationsTable({ clients, emptyMessage }: PortalAdminConsultationsTableProps) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const sortedRows = useMemo(() => sortRows(clients, sort), [clients, sort]);

  function handleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {clients.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm lg:min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-left">
                <SortableHeader label="Name" column="name" sort={sort} onSort={handleSort} />
                <th scope="col" className="hidden px-4 py-3 font-medium text-foreground lg:table-cell">
                  Email
                </th>
                <SortableHeader
                  label="Preferred"
                  column="preferredContact"
                  sort={sort}
                  onSort={handleSort}
                  className="hidden md:table-cell"
                />
                <SortableHeader
                  label="Requests"
                  column="requestCount"
                  sort={sort}
                  onSort={handleSort}
                  className="hidden sm:table-cell"
                />
                <SortableHeader label="Latest" column="createdAt" sort={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((client) => (
                <tr key={client.clientKey} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={getPortalAdminConsultationDetailPath(client.clientKey)}
                      className="group inline-flex min-w-0 items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
                    >
                      <PortalAdminTableNameEditIcon />
                      <span className="min-w-0 truncate">{client.name}</span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${encodeURIComponent(client.email)}`}
                        className="text-foreground transition-colors hover:text-primary"
                      >
                        {client.email}
                      </a>
                      {client.hasBouncedEmail ? (
                        <ConsultationEmailDeliveryBadge status="bounced" />
                      ) : null}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatPortalAdminPreferredContact(client.preferredContact)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{client.requestCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    <time dateTime={client.createdAt}>
                      {formatPortalAdminConsultationTableDate(client.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
