'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { PortalChangePasswordDialog } from '@/components/portal-change-password-dialog';
import { CONSULTATION_EMAIL_MAX_LENGTH } from '@/lib/field-lengths';
import { PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/password-policy';
import { portalLoginSchema, type PortalLoginValues } from '@/lib/portal-login-schema';
import { getPortalHomePath } from '@/lib/portal-role-data';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalLoginFormProps = {
  requirePasswordChange?: boolean;
};

export function PortalLoginForm({ requirePasswordChange = false }: PortalLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [passwordChangeDismissed, setPasswordChangeDismissed] = React.useState(false);

  React.useEffect(() => {
    if (requirePasswordChange && !passwordChangeDismissed) {
      setChangePasswordOpen(true);
    }
  }, [requirePasswordChange, passwordChangeDismissed]);

  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { setValue } = form;

  React.useEffect(() => {
    const email = searchParams.get('email')?.trim();
    if (email) {
      setValue('email', email);
    }
  }, [searchParams, setValue]);

  async function onSubmit(values: PortalLoginValues) {
    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let payload: {
        ok?: boolean;
        error?: string;
        mustChangePassword?: boolean;
        redirectTo?: string;
        role?: string;
      } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Invalid email or password.',
        });
        return;
      }

      if (payload.mustChangePassword) {
        setPasswordChangeDismissed(false);
        setChangePasswordOpen(true);
        return;
      }

      const destination =
        typeof payload.redirectTo === 'string' && payload.redirectTo.length > 0
          ? payload.redirectTo
          : getPortalHomePath(payload.role);

      router.push(destination);
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: 'Network error. Please try again.',
      });
    });
  }

  function handleChangePasswordOpenChange(open: boolean) {
    setChangePasswordOpen(open);
    if (!open) {
      setPasswordChangeDismissed(true);
    }
  }

  function handlePasswordChangeCompleted(redirectTo?: string) {
    setChangePasswordOpen(false);
    setPasswordChangeDismissed(false);
    form.reset({ email: form.getValues('email'), password: '' });
    router.push(redirectTo && redirectTo.length > 0 ? redirectTo : getPortalHomePath(undefined));
  }

  return (
    <>
      <section
        id="sign-in"
        className="relative overflow-hidden bg-background px-[1.25rem] py-16 md:py-20 scroll-mt-28"
      >
        <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl md:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LogIn className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
              <p className="mt-2 text-sm text-muted-foreground">Use your client portal credentials</p>
            </div>

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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          autoComplete="current-password"
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
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing In…' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/portal/forgot-password" className="text-primary underline-offset-4 hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </section>

      <PortalChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={handleChangePasswordOpenChange}
        onCompleted={handlePasswordChangeCompleted}
        mustChangePassword={requirePasswordChange}
      />
    </>
  );
}
