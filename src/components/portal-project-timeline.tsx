'use client';

import { useMemo, type ReactNode } from 'react';
import {
  formatTimelineDate,
  getTimelineProgressPercent,
  type PortalProjectTimelineData,
} from '@/lib/portal-timeline-data';

type PortalProjectTimelineProps = {
  projects: PortalProjectTimelineData[];
  /** ISO timestamp from the server — keeps SSR and hydration in sync for "today" markers. */
  referenceNow: string;
  description?: string;
  emptyMessage?: string;
  /** Optional actions rendered below the timeline charts (admin-only callers). */
  actions?: ReactNode;
};

const CHART = {
  width: 640,
  height: 220,
  padLeft: 48,
  padRight: 24,
  padTop: 24,
  padBottom: 56,
};

function ProjectTimelineChart({
  data,
  referenceNow,
}: {
  data: PortalProjectTimelineData;
  referenceNow: string;
}) {
  const { startLabel, endLabel, todayLabel, progress, todayX, todayLabelX, todayLabelAnchor, linePath, todayY } =
    useMemo(() => {
    const startMs = new Date(data.consultationStartedAt).getTime();
    const endMs = new Date(data.timelineEndAt).getTime();
    const nowMs = new Date(referenceNow).getTime();
    const progressPct = getTimelineProgressPercent(
      data.consultationStartedAt,
      data.timelineEndAt,
      nowMs
    );

    const plotWidth = CHART.width - CHART.padLeft - CHART.padRight;
    const plotHeight = CHART.height - CHART.padTop - CHART.padBottom;
    const todayRatio = Math.min(1, Math.max(0, (nowMs - startMs) / (endMs - startMs)));
    const todayXPos = CHART.padLeft + todayRatio * plotWidth;
    const todayYPos = CHART.padTop + plotHeight - (progressPct / 100) * plotHeight;

    const x0 = CHART.padLeft;
    const y0 = CHART.padTop + plotHeight;
    const x1 = CHART.padLeft + plotWidth;
    const y1 = CHART.padTop;

    const plotLeft = CHART.padLeft;
    const plotRight = CHART.width - CHART.padRight;
    const earlyTimelineThreshold = plotLeft + 72;

    let todayLabelX = todayXPos;
    let todayLabelAnchor: 'start' | 'middle' | 'end' = 'middle';

    if (todayXPos <= earlyTimelineThreshold) {
      todayLabelX = plotLeft;
      todayLabelAnchor = 'start';
    } else if (todayXPos >= plotRight - 72) {
      todayLabelX = plotRight;
      todayLabelAnchor = 'end';
    }

    return {
      startLabel: formatTimelineDate(data.consultationStartedAt, data.timeZone),
      endLabel: data.endDateIsTbd
        ? 'TBD'
        : formatTimelineDate(data.estimatedCompletionAt!, data.timeZone),
      todayLabel: formatTimelineDate(new Date(nowMs).toISOString(), data.timeZone),
      progress: Math.round(progressPct),
      todayX: todayXPos,
      todayLabelX,
      todayLabelAnchor,
      linePath: `M ${x0} ${y0} L ${x1} ${y1}`,
      todayY: todayYPos,
    };
  }, [data, referenceNow]);

  const plotBottom = CHART.height - CHART.padBottom;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold text-foreground">{data.projectTitle}</h3>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>

        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="h-auto w-full text-primary"
          role="img"
          aria-label={`${data.projectTitle} timeline from ${startLabel} to ${data.endDateIsTbd ? 'TBD' : endLabel}, ${progress}% complete`}
        >
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = CHART.padTop + (CHART.height - CHART.padTop - CHART.padBottom) * (1 - tick / 100);
            return (
              <g key={tick}>
                <line
                  x1={CHART.padLeft}
                  x2={CHART.width - CHART.padRight}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={CHART.padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />

          <circle cx={CHART.padLeft} cy={plotBottom} r={5} className="fill-primary" />
          <circle cx={CHART.width - CHART.padRight} cy={CHART.padTop} r={5} className="fill-primary/60" />

          <line
            x1={todayX}
            x2={todayX}
            y1={CHART.padTop}
            y2={plotBottom}
            className="stroke-primary/40"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={todayX} cy={todayY} r={6} className="fill-background stroke-primary" strokeWidth={2} />

          <text
            x={CHART.padLeft}
            y={CHART.height - 28}
            className="fill-foreground text-[11px] font-medium"
          >
            Start
          </text>
          <text x={CHART.padLeft} y={CHART.height - 12} className="fill-muted-foreground text-[10px]">
            {startLabel}
          </text>

          <text
            x={CHART.width - CHART.padRight}
            y={CHART.height - 28}
            textAnchor="end"
            className="fill-foreground text-[11px] font-medium"
          >
            Est. completion
          </text>
          <text
            x={CHART.width - CHART.padRight}
            y={CHART.height - 12}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {endLabel}
          </text>

          <text
            x={todayLabelX}
            y={CHART.padTop - 8}
            textAnchor={todayLabelAnchor}
            className="fill-primary text-[10px] font-medium"
          >
            Today · {todayLabel}
          </text>
        </svg>
    </div>
  );
}

export function PortalProjectTimeline({
  projects,
  referenceNow,
  description,
  emptyMessage,
  actions,
}: PortalProjectTimelineProps) {
  const sectionDescription =
    description ??
    "View progress from your consultation date through the project's estimated completion date.";
  const sectionEmptyMessage =
    emptyMessage ??
    'Your project timeline will appear here once a consultation is linked to your account.';

  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-timeline-heading">
      <h2 id="portal-timeline-heading" className="mb-2 text-2xl font-bold text-foreground">
        Project Timeline
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">{sectionDescription}</p>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{sectionEmptyMessage}</p>
      ) : (
        <div className="space-y-6">
          {projects.map((project, index) => (
            <ProjectTimelineChart
              key={project.projectId || `timeline-chart-${index}`}
              data={project}
              referenceNow={referenceNow}
            />
          ))}
          {actions != null ? <div key="portal-project-timeline-actions">{actions}</div> : null}
        </div>
      )}
    </section>
  );
}
