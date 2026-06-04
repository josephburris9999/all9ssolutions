'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortalChangePasswordDialog } from '@/components/portal-change-password-dialog';
import { getPortalHomePath } from '@/lib/portal-role-data';

type PortalClientChangePasswordFieldProps = {
  mustChangePassword?: boolean;
};

export function PortalClientChangePasswordField({
  mustChangePassword = false,
}: PortalClientChangePasswordFieldProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCompleted(redirectTo?: string) {
    setDialogOpen(false);
    router.refresh();
    const target = redirectTo && redirectTo.length > 0 ? redirectTo : getPortalHomePath('c');
    router.push(target);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
        <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
        Reset Password
      </Button>
      <PortalChangePasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCompleted={handleCompleted}
        mustChangePassword={mustChangePassword}
      />
    </>
  );
}
