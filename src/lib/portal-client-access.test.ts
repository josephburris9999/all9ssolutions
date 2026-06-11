import { describe, expect, it } from 'vitest';
import { CLIENT_PORTAL_NO_ACTIVE_PROJECT_MESSAGE } from './portal-client-access';

describe('portal-client-access', () => {
  it('exposes a clear login denial message for clients without active projects', () => {
    expect(CLIENT_PORTAL_NO_ACTIVE_PROJECT_MESSAGE).toMatch(/active project/i);
  });
});
