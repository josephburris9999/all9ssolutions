import type { Metadata } from 'next';
import { PortalForgotPasswordForm } from '@/components/portal-forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password | all9s Solutions',
  description: 'Reset your all9s Solutions client portal password.',
};

export default function PortalForgotPasswordPage() {
  return (
    <main className="min-h-screen">
      <PortalForgotPasswordForm />
    </main>
  );
}
