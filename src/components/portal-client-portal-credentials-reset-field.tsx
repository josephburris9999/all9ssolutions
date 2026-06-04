'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PORTAL_DEFAULT_CLIENT_PASSWORD } from '@/lib/portal-default-password';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalClientPortalCredentialsResetFieldProps = {
  consultationRequestId: string;
};

export function PortalClientPortalCredentialsResetField({
  consultationRequestId,
}: PortalClientPortalCredentialsResetFieldProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting: isResetting, runGuardedSubmit } = useSubmitGuard();

  async function handleResetCredentials() {
    await runGuardedSubmit(async () => {
      const response = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/portal-user/reset`,
        { method: 'POST' }
      );

      let payload: {
        ok?: boolean;
        error?: string;
        password?: string;
        emailSent?: boolean;
        emailSkipped?: boolean;
      } = {};
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!response.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not reset portal credentials',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again.',
        });
        return;
      }

      router.refresh();

      if (payload.emailSent) {
        toast({
          title: 'Portal credentials reset',
          description: `Password set to ${payload.password ?? PORTAL_DEFAULT_CLIENT_PASSWORD}. An email was sent to the client with sign-in instructions.`,
        });
        return;
      }

      toast({
        title: 'Portal credentials reset',
        description: payload.emailSkipped
          ? `Password set to ${payload.password ?? PORTAL_DEFAULT_CLIENT_PASSWORD}. Email was not sent because email is not configured.`
          : `Password set to ${payload.password ?? PORTAL_DEFAULT_CLIENT_PASSWORD}, but the notification email could not be sent.`,
        variant: payload.emailSkipped ? 'default' : 'destructive',
      });
    });
  }

  return (
    <div className="w-fit max-w-full min-w-0 space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Credentials
      </dt>
      <dd>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isResetting}
          onClick={() => void handleResetCredentials()}
        >
          {isResetting ? 'Resetting…' : 'Reset Portal Credentials'}
        </Button>
      </dd>
    </div>
  );
}
