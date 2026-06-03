'use client';

import React from 'react';
import { PORTAL_SIGNED_IN_PATHS } from '@/lib/portal-role-data';

const LOGOUT_URL = '/api/portal/logout';

function endPortalSession() {
  void fetch(LOGOUT_URL, { method: 'POST', keepalive: true });
}

function isPortalSignedInPath(pathname: string): boolean {
  return PORTAL_SIGNED_IN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Clears the portal session cookie when the user leaves a signed-in portal page
 * (client dashboard or admin portal).
 */
export function PortalDashboardSession() {
  React.useEffect(() => {
    const handlePageHide = () => {
      endPortalSession();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);

      if (isPortalSignedInPath(window.location.pathname)) {
        return;
      }

      endPortalSession();
    };
  }, []);

  return null;
}
