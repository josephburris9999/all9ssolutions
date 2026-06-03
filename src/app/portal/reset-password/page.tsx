import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortalResetPasswordForm } from '@/components/portal-reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password | all9s Solutions',
  description: 'Choose a new password for your all9s Solutions client portal account.',
};

export default function PortalResetPasswordPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <PortalResetPasswordForm />
      </Suspense>
    </main>
  );
}
