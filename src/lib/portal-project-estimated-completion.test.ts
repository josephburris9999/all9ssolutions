import { describe, expect, it } from 'vitest';
import {
  estimatedCompletionIsoToDateInput,
  getMinProjectDateInputValue,
  isEstimatedCompletionDateAllowed,
  isEstimatedCompletionDateAllowedOnServer,
  parseEstimatedCompletionInput,
} from './portal-project-estimated-completion';

describe('portal-project-estimated-completion', () => {
  const reference = new Date(2026, 5, 2, 15, 30, 0, 0);

  it('formats min date input from reference date', () => {
    expect(getMinProjectDateInputValue(reference)).toBe('2026-06-02');
  });

  it('converts stored ISO to date input', () => {
    expect(estimatedCompletionIsoToDateInput('2026-08-15T12:00:00.000Z')).toBe('2026-08-15');
  });

  it('allows today and future dates locally', () => {
    expect(isEstimatedCompletionDateAllowed('2026-06-02', reference)).toBe(true);
    expect(isEstimatedCompletionDateAllowed('2026-06-03', reference)).toBe(true);
    expect(isEstimatedCompletionDateAllowed('2026-06-01', reference)).toBe(false);
  });

  it('allows today and future dates on the server', () => {
    const utcReference = new Date('2026-06-02T23:30:00.000Z');
    expect(isEstimatedCompletionDateAllowedOnServer('2026-06-02', utcReference)).toBe(true);
    expect(isEstimatedCompletionDateAllowedOnServer('2026-06-03', utcReference)).toBe(true);
    expect(isEstimatedCompletionDateAllowedOnServer('2026-06-01', utcReference)).toBe(false);
  });

  it('parses date-only input at local noon', () => {
    const parsed = parseEstimatedCompletionInput('2026-06-02');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(5);
    expect(parsed!.getDate()).toBe(2);
  });
});
