import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { subscribePortalAdminCategoryCountsRealtime } from './portal-admin-category-counts-realtime';

describe('subscribePortalAdminCategoryCountsRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces postgres change notifications', () => {
    const handlers: Array<() => void> = [];
    const channel = {
      on: vi.fn((_event: string, _filter: unknown, handler: () => void) => {
        handlers.push(handler);
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };

    const supabase = {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };

    const onChange = vi.fn();
    const subscription = subscribePortalAdminCategoryCountsRealtime(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      onChange
    );

    expect(supabase.channel).toHaveBeenCalledWith('portal-admin-client-category-counts');
    expect(handlers.length).toBeGreaterThan(0);

    handlers[0]?.();
    handlers[0]?.();
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
