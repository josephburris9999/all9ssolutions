'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatPortalAdminConsultationTableDate,
  formatPortalAdminPreferredContact,
  type PortalAdminConsultationRow,
} from '@/lib/portal-admin-client-display';
import { formatPhoneNumber } from '@/lib/phone';
import { cn } from '@/lib/utils';

export type PortalAdminClientsTableProps = {
  rows: PortalAdminConsultationRow[];
  detailPathPrefix: string;
  emptyMessage: string;
  secondaryColumn?: 'company' | 'project';
  showPhoneColumn?: boolean;
  scrollContainerClassName?: string;
  selectionMode?: boolean;
  selectedRowId?: string | null;
  onSelectRow?: (rowId: string) => void;
};

type SortColumn = 'name' | 'company' | 'project' | 'preferredContact' | 'createdAt';
type SortDirection = 'asc' | 'desc';

type SortState = {
  column: SortColumn;
  direction: SortDirection;
};

const DEFAULT_SORT: SortState = {
  column: 'createdAt',
  direction: 'desc',
};

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) {
    return '—';
  }

  const formatted = formatPhoneNumber(phone);
  return formatted.length > 0 ? formatted : phone;
}

function comparePortalAdminClientRows(
  a: PortalAdminConsultationRow,
  b: PortalAdminConsultationRow,
  column: SortColumn
): number {
  switch (column) {
    case 'name':
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    case 'company': {
      const aCompany = a.company?.trim() ?? '';
      const bCompany = b.company?.trim() ?? '';

      if (!aCompany && bCompany) {
        return 1;
      }

      if (aCompany && !bCompany) {
        return -1;
      }

      return aCompany.localeCompare(bCompany, undefined, { sensitivity: 'base' });
    }
    case 'project': {
      const aProject = a.projectTitle?.trim() ?? '';
      const bProject = b.projectTitle?.trim() ?? '';

      if (!aProject && bProject) {
        return 1;
      }

      if (aProject && !bProject) {
        return -1;
      }

      return aProject.localeCompare(bProject, undefined, { sensitivity: 'base' });
    }
    case 'preferredContact':
      return a.preferredContact.localeCompare(b.preferredContact);
    case 'createdAt':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
}

function sortPortalAdminClientRows(
  rows: PortalAdminConsultationRow[],
  sort: SortState
): PortalAdminConsultationRow[] {
  const sorted = [...rows].sort((a, b) => comparePortalAdminClientRows(a, b, sort.column));

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
    <th scope="col" className={cn('px-4 py-3 font-medium text-foreground', className)} aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-primary"
      >
        <span>{label}</span>
        <SortIcon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      </button>
    </th>
  );
}

export function PortalAdminClientsTable({
  rows,
  detailPathPrefix,
  emptyMessage,
  secondaryColumn = 'company',
  showPhoneColumn = true,
  scrollContainerClassName,
  selectionMode = false,
  selectedRowId = null,
  onSelectRow,
}: PortalAdminClientsTableProps) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const secondaryColumnKey = secondaryColumn === 'project' ? 'project' : 'company';
  const secondaryColumnLabel = secondaryColumn === 'project' ? 'Project' : 'Company';

  const sortedRows = useMemo(() => sortPortalAdminClientRows(rows, sort), [rows, sort]);

  function handleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  }

  function renderPrimaryCell(row: PortalAdminConsultationRow, isSelected: boolean) {
    const label = row.name;

    if (selectionMode) {
      return (
        <span
          className={cn(
            'font-medium',
            isSelected ? 'text-primary' : 'text-foreground'
          )}
        >
          {label}
        </span>
      );
    }

    return (
      <Link
        href={`${detailPathPrefix}/${row.id}`}
        className="font-medium text-foreground transition-colors hover:text-primary"
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className={cn('overflow-x-auto', scrollContainerClassName)}>
          <table className="w-full border-collapse text-sm lg:min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-left">
                <SortableHeader label="Name" column="name" sort={sort} onSort={handleSort} />
                <SortableHeader
                  label={secondaryColumnLabel}
                  column={secondaryColumnKey}
                  sort={sort}
                  onSort={handleSort}
                  className="hidden md:table-cell"
                />
                <th scope="col" className="hidden px-4 py-3 font-medium text-foreground lg:table-cell">
                  Email
                </th>
                {showPhoneColumn ? (
                  <th scope="col" className="hidden px-4 py-3 font-medium text-foreground lg:table-cell">
                    Phone
                  </th>
                ) : null}
                <SortableHeader
                  label="Preferred"
                  column="preferredContact"
                  sort={sort}
                  onSort={handleSort}
                  className="hidden md:table-cell"
                />
                <SortableHeader label="Submitted" column="createdAt" sort={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const isSelected = selectionMode && selectedRowId === row.id;

                return (
                <tr
                  key={row.id}
                  onClick={selectionMode ? () => onSelectRow?.(row.id) : undefined}
                  onKeyDown={
                    selectionMode
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectRow?.(row.id);
                          }
                        }
                      : undefined
                  }
                  tabIndex={selectionMode ? 0 : undefined}
                  aria-selected={selectionMode ? isSelected : undefined}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    selectionMode && 'cursor-pointer transition-colors hover:bg-secondary/20',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  <td className="px-4 py-3">{renderPrimaryCell(row, isSelected)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {secondaryColumn === 'project'
                      ? row.projectTitle ?? '—'
                      : row.company ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    <a
                      href={`mailto:${encodeURIComponent(row.email)}`}
                      onClick={selectionMode ? (event) => event.stopPropagation() : undefined}
                      className="text-foreground transition-colors hover:text-primary"
                    >
                      {row.email}
                    </a>
                  </td>
                  {showPhoneColumn ? (
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatPhoneDisplay(row.phone)}
                    </td>
                  ) : null}
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatPortalAdminPreferredContact(row.preferredContact)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    <time dateTime={row.createdAt}>
                      {formatPortalAdminConsultationTableDate(row.createdAt)}
                    </time>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
