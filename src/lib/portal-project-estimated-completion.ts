const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE =
  'Completion date must be today or in the future';

export const PROJECT_ESTIMATED_COMPLETION_FUTURE_DATE_MESSAGE =
  'Completion date must be in the future';

export const PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE =
  'Estimated completion date is required';

/** Parse a date input (`YYYY-MM-DD`) or ISO datetime for estimated project completion. */
export function parseEstimatedCompletionInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Convert form input to ISO string, using 12:00 local time for date-only values. */
export function estimatedCompletionInputToIso(value: string): string | undefined {
  const parsed = parseEstimatedCompletionInput(value);
  return parsed ? parsed.toISOString() : undefined;
}

/** Parse date-only values on the server (UTC noon) or full ISO datetimes. */
export function parseEstimatedCompletionInputOnServer(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Minimum allowed `<input type="date">` value (local calendar date). */
export function getMinProjectDateInputValue(referenceDate = new Date()): string {
  return formatDateInputValue(referenceDate);
}

/** Minimum allowed `<input type="date">` value for dates strictly after today. */
export function getMinFutureProjectDateInputValue(referenceDate = new Date()): string {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateInputValue(tomorrow);
}

/** Convert stored completion ISO to a date input value in the local calendar. */
export function estimatedCompletionIsoToDateInput(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return formatDateInputValue(parsed);
}

function startOfLocalCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Client-side guard for project completion dates (today or future in local time). */
export function isEstimatedCompletionDateAllowed(
  value: string,
  referenceDate = new Date()
): boolean {
  const parsed = parseEstimatedCompletionInput(value);
  if (!parsed) {
    return false;
  }

  return (
    startOfLocalCalendarDay(parsed).getTime() >= startOfLocalCalendarDay(referenceDate).getTime()
  );
}

/** Client-side guard for project completion dates strictly after today in local time. */
export function isFutureEstimatedCompletionDateAllowed(
  value: string,
  referenceDate = new Date()
): boolean {
  const parsed = parseEstimatedCompletionInput(value);
  if (!parsed) {
    return false;
  }

  return (
    startOfLocalCalendarDay(parsed).getTime() > startOfLocalCalendarDay(referenceDate).getTime()
  );
}

function startOfUtcCalendarDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Server-side guard for project completion dates (today or future in UTC). */
export function isEstimatedCompletionDateAllowedOnServer(
  value: string,
  referenceDate = new Date()
): boolean {
  const parsed = parseEstimatedCompletionInputOnServer(value);
  if (!parsed) {
    return false;
  }

  return startOfUtcCalendarDay(parsed) >= startOfUtcCalendarDay(referenceDate);
}

/** Server-side guard for project completion dates strictly after today in UTC. */
export function isFutureEstimatedCompletionDateAllowedOnServer(
  value: string,
  referenceDate = new Date()
): boolean {
  const parsed = parseEstimatedCompletionInputOnServer(value);
  if (!parsed) {
    return false;
  }

  return startOfUtcCalendarDay(parsed) > startOfUtcCalendarDay(referenceDate);
}
