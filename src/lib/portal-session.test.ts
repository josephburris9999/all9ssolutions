import { describe, expect, it } from 'vitest';
import { createPortalSessionToken, parsePortalSessionToken } from './portal-session';

const secret = 'test-portal-session-secret-min-32-chars';

describe('portal-session', () => {
  it('round-trips a session token', () => {
    const token = createPortalSessionToken(
      { userId: 'user_1', email: 'client@example.com', role: 'c', mustChangePassword: true },
      secret,
      3600
    );
    const parsed = parsePortalSessionToken(token, secret);
    expect(parsed).not.toBeNull();
    expect(parsed?.userId).toBe('user_1');
    expect(parsed?.email).toBe('client@example.com');
    expect(parsed?.role).toBe('c');
    expect(parsed?.mustChangePassword).toBe(true);
  });

  it('normalizes admin role in session tokens', () => {
    const token = createPortalSessionToken(
      { userId: 'admin_1', email: 'admin@example.com', role: 'a', mustChangePassword: false },
      secret
    );
    const parsed = parsePortalSessionToken(token, secret);
    expect(parsed?.role).toBe('a');
  });

  it('defaults missing role to client', () => {
    const payload = {
      v: 1,
      userId: 'user_1',
      email: 'client@example.com',
      mustChangePassword: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const { createHmac } = require('crypto');
    const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const token = `${payloadB64}.${signature}`;
    expect(parsePortalSessionToken(token, secret)?.role).toBe('c');
  });

  it('rejects tampered tokens', () => {
    const token = createPortalSessionToken(
      { userId: 'user_1', email: 'client@example.com', role: 'c', mustChangePassword: false },
      secret
    );
    const tampered = `${token}x`;
    expect(parsePortalSessionToken(tampered, secret)).toBeNull();
  });
});
