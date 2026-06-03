type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Simple in-memory rate limiter (per server instance).
 * For multi-instance production, use Redis or your edge/CDN rate limits.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  // Next.js dev often omits proxy headers; avoid one shared "unknown" bucket for all testers.
  if (process.env.NODE_ENV === 'development') {
    return 'dev-local';
  }

  return 'unknown';
}

/** Off in development unless explicitly forced on. Override with DISABLE_CONSULTATION_RATE_LIMIT=true. */
export function isConsultationRateLimitEnabled(): boolean {
  if (process.env.DISABLE_CONSULTATION_RATE_LIMIT === 'true') return false;
  if (process.env.NODE_ENV === 'development') return false;
  return true;
}

/** Off in development unless explicitly forced on. Override with DISABLE_PORTAL_RATE_LIMIT=true. */
export function isPortalRateLimitEnabled(): boolean {
  if (process.env.DISABLE_PORTAL_RATE_LIMIT === 'true') return false;
  if (process.env.NODE_ENV === 'development') return false;
  return true;
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
