'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CONSULTATION_EMAIL_MAX_LENGTH } from '@/lib/field-lengths';
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  portalForgotPasswordSchema,
  type PortalForgotPasswordValues,
} from '@/lib/portal-forgot-password-schema';
import { PORTAL_PATH } from '@/lib/portal-url';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

export function PortalForgotPasswordForm() {
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<PortalForgotPasswordValues>({
    resolver: zodResolver(portalForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: PortalForgotPasswordValues) {
    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let payload: { ok?: boolean; error?: string; message?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // non-JSON
      }

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not send reset email',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again later.',
        });
        return;
      }

      setSubmitted(true);
      toast({
        title: 'Check your email',
        description:
          typeof payload.message === 'string' && payload.message.length > 0
            ? payload.message
            : FORGOT_PASSWORD_SUCCESS_MESSAGE,
      });
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not send reset email',
        description: 'Network error. Please try again.',
      });
    });
  }

  return (
    <section
      id="sign-in"
      className="relative scroll-mt-28 overflow-hidden bg-background px-[1.25rem] py-16 md:py-20"
    >
      <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Forgot your password?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the email on your consultation request. We will send a reset link if a portal account
              exists.
            </p>
          </div>

          {submitted ? (
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              {FORGOT_PASSWORD_SUCCESS_MESSAGE}
            </p>
          ) : (
            <Form {...form}>
              <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@company.com"
                          autoComplete="email"
                          maxLength={CONSULTATION_EMAIL_MAX_LENGTH}
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
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </Form>
          )}

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
