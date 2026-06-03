export type PortalProjectTimelineData = {
  projectId: string;
  projectTitle: string;
  consultationStartedAt: string;
  /** Stored completion date from the project row, if set. */
  estimatedCompletionAt: string | null;
  /** End of the chart axis — actual completion or one month after consultation start. */
  timelineEndAt: string;
  /** When true, the UI shows "TBD" instead of a formatted end date. */
  endDateIsTbd: boolean;
  timeZone: string;
};

/** One calendar month after the consultation start (used when no completion date is set). */
export function getDefaultTimelineEndIso(startIso: string): string {
  const end = new Date(startIso);
  end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

export function formatTimelineDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(new Date(iso));
}

/** Linear project progress 0–100 from start through today (clamped). */
export function getTimelineProgressPercent(
  startIso: string,
  endIso: string,
  nowMs: number = Date.now()
): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (end <= start) return 0;

  const ratio = (nowMs - start) / (end - start);
  return Math.min(100, Math.max(0, ratio * 100));
}
