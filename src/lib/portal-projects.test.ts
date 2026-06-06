import { describe, expect, it } from 'vitest';
import {
  portalProjectDashboardHref,
  resolvePortalProjectGate,
  resolvePortalClientProjectGate,
  type PortalProjectOption,
} from '@/lib/portal-projects';

function project(id: string): PortalProjectOption {
  return {
    id,
    title: `Project ${id}`,
    status: 'ACTIVE',
    consultationRequestId: `consult-${id}`,
  };
}

describe('resolvePortalProjectGate', () => {
  it('returns none when there are no projects', () => {
    expect(resolvePortalProjectGate([], null)).toEqual({ kind: 'none' });
  });

  it('redirects when only one project and none selected', () => {
    expect(resolvePortalProjectGate([project('a')], undefined)).toEqual({
      kind: 'redirect',
      projectId: 'a',
    });
  });

  it('is ready when one project is selected', () => {
    const only = project('a');
    expect(resolvePortalProjectGate([only], 'a')).toEqual({ kind: 'ready', project: only });
  });

  it('redirects when one project and selection is invalid', () => {
    expect(resolvePortalProjectGate([project('a')], 'wrong')).toEqual({
      kind: 'redirect',
      projectId: 'a',
    });
  });

  it('shows picker when multiple projects and none selected', () => {
    expect(resolvePortalProjectGate([project('a'), project('b')], null)).toEqual({ kind: 'picker' });
  });

  it('is ready when multiple projects and a valid selection', () => {
    const second = project('b');
    expect(resolvePortalProjectGate([project('a'), second], 'b')).toEqual({
      kind: 'ready',
      project: second,
    });
  });

  it('shows picker when selection is invalid', () => {
    expect(resolvePortalProjectGate([project('a'), project('b')], 'missing')).toEqual({
      kind: 'picker',
    });
  });
});

describe('portalProjectDashboardHref', () => {
  it('appends project query param', () => {
    expect(portalProjectDashboardHref('/portal/dashboard', 'proj_1')).toBe(
      '/portal/dashboard?project=proj_1'
    );
  });
});

describe('resolvePortalClientProjectGate', () => {
  it('returns landing when a completed project id is not in the active list', () => {
    expect(resolvePortalClientProjectGate([project('a')], 'completed-only')).toEqual({
      kind: 'landing',
    });
  });

  it('is ready for an active project selection', () => {
    const active = project('a');
    expect(resolvePortalClientProjectGate([active], 'a')).toEqual({
      kind: 'ready',
      project: active,
    });
  });
});
