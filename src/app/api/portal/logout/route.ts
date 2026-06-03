import { NextResponse } from 'next/server';
import { clearPortalSession, clearPortalSessionCookie } from '@/lib/portal-auth';

export const runtime = 'nodejs';

export async function POST() {
  await clearPortalSession();

  const response = NextResponse.json({ ok: true });
  const cleared = clearPortalSessionCookie();
  response.cookies.set(cleared.name, cleared.value, {
    httpOnly: cleared.httpOnly,
    secure: cleared.secure,
    sameSite: cleared.sameSite,
    path: cleared.path,
    maxAge: cleared.maxAge,
  });

  return response;
}
