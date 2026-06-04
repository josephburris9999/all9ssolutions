'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { PASSWORD_POLICY_HINT, PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/password-policy';
import {
  portalChangePasswordSchema,
  type PortalChangePasswordValues,
} from '@/lib/portal-change-password-schema';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (redirectTo?: string) => void;
  /** First-time / temporary password — adjusts dialog copy. */
  mustChangePassword?: boolean;
};

export function PortalChangePasswordDialog({
  open,
  onOpenChange,
  onCompleted,
  mustChangePassword = false,
}: PortalChangePasswordDialogProps) {
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();

  const form = useForm<PortalChangePasswordValues>({
    resolver: zodResolver(portalChangePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  const { reset } = form;

  React.useEffect(() => {
    if (open) {
      reset({ newPassword: '', confirmPassword: '' });
    }
  }, [open, reset]);

  async function onSubmit(values: PortalChangePasswordValues) {
    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let payload: { ok?: boolean; error?: string; redirectTo?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not update password',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Password updated',
        description: 'Your portal password has been set.',
      });
      onCompleted(payload.redirectTo);
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not update password',
        description: 'Network error. Please try again.',
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mustChangePassword ? 'Set your password' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {mustChangePassword
              ? 'Choose a new password to continue using the client portal.'
              : 'Choose a new password for your portal account. '}
            {PASSWORD_POLICY_HINT}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder={PASSWORD_POLICY_HINT}
                      excludeToggleFromTabOrder
                      maxLength={PORTAL_PASSWORD_MAX_LENGTH}
                      {...field}
                      required
                      className="border-border bg-secondary/50 text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      excludeToggleFromTabOrder
                      maxLength={PORTAL_PASSWORD_MAX_LENGTH}
                      {...field}
                      required
                      className="border-border bg-secondary/50 text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full sm:flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
