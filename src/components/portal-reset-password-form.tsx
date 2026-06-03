'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { PASSWORD_POLICY_HINT, PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/password-policy';
import {
  portalResetPasswordSchema,
  type PortalResetPasswordValues,
} from '@/lib/portal-reset-password-schema';
import { PORTAL_PATH } from '@/lib/portal-url';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

export function PortalResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();

  const token = searchParams.get('token')?.trim() ?? '';

  const form = useForm<PortalResetPasswordValues>({
    resolver: zodResolver(portalResetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { setValue } = form;

  React.useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  async function onSubmit(values: PortalResetPasswordValues) {
    if (!values.token) {
      toast({
        variant: 'destructive',
        title: 'Invalid reset link',
        description: 'Request a new password reset email from the sign-in page.',
      });
      return;
    }

    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // non-JSON
      }

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not reset password',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'This link may be invalid or expired.',
        });
        return;
      }

      toast({
        title: 'Password updated',
        description: 'You can sign in with your new password.',
      });
      router.push(PORTAL_PATH);
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not reset password',
        description: 'Network error. Please try again.',
      });
    });
  }

  if (!token) {
    return (
      <section className="relative overflow-hidden bg-background px-[1.25rem] py-16 md:py-20">
        <div className="container mx-auto max-w-md px-4 text-center">
          <p className="text-muted-foreground">This reset link is missing or invalid.</p>
          <p className="mt-4">
            <Link href="/portal/forgot-password" className="text-primary underline-offset-4 hover:underline">
              Request a new reset link
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-background px-[1.25rem] py-16 md:py-20">
      <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Set a new password</h2>
            <p className="mt-2 text-sm text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
          </div>

          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...form.register('token')} />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">New password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={PASSWORD_POLICY_HINT}
                        autoComplete="new-password"
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
                    <FormLabel className="text-foreground">Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
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
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href={PORTAL_PATH} className="text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
