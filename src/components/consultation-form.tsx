"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { consultationFormSchema, type ConsultationFormValues } from '@/lib/consultation-schema';
import {
  CONSULTATION_COMPANY_MAX_LENGTH,
  CONSULTATION_EMAIL_MAX_LENGTH,
  CONSULTATION_MESSAGE_MAX_LENGTH,
  CONSULTATION_NAME_MAX_LENGTH,
  CONSULTATION_PHONE_MAX_LENGTH,
} from '@/lib/field-lengths';
import { cn } from '@/lib/utils';
import { formatPhoneNumber, isCompletePhoneNumber } from '@/lib/phone';
import { getTimezoneOptions } from '@/lib/timezones';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { MessageSquare, Send } from 'lucide-react';

const consultationFormEndpoint =
  process.env.NEXT_PUBLIC_CONSULTATION_FORM_ENDPOINT ?? '/api/consultation';

const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();

export function ConsultationForm() {
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [honeypot, setHoneypot] = React.useState('');
  const [turnstileToken, setTurnstileToken] = React.useState('');
  const formStartedAtRef = React.useRef(Date.now());
  const timezoneOptions = React.useMemo(() => getTimezoneOptions(), []);
  const turnstileRequired = turnstileSiteKey.length > 0;

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      timezone: "",
      preferredContact: "e",
      company: "",
      message: "",
    },
  });

  const phoneValue = form.watch('phone');
  const hasPhone = isCompletePhoneNumber(phoneValue);

  const { setValue } = form;

  React.useEffect(() => {
    if (!hasPhone) {
      setValue('timezone', '');
    }
  }, [hasPhone, setValue]);

  async function onSubmit(values: ConsultationFormValues) {
    if (honeypot.trim().length > 0) {
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      toast({
        variant: 'destructive',
        title: 'Security check required',
        description: 'Please complete the verification below the form.',
      });
      return;
    }

    await runGuardedSubmit(async () => {
      const res = await fetch(consultationFormEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          website: honeypot,
          _formStartedAt: formStartedAtRef.current,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });

      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not send request',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again or email hello@all9ssolutions.com.',
        });
        return;
      }

      toast({
        title: 'Consultation Requested',
        description: 'We will contact you within 1 business day.',
      });
      form.reset();
      setTurnstileToken('');
      formStartedAtRef.current = Date.now();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not send request',
        description: 'Network error. Please try again or email hello@all9ssolutions.com.',
      });
    });
  }

  return (
    <section id="consultation" className="bg-background px-[1.25rem] py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div className="flex flex-1 flex-col bg-primary p-8 text-primary-foreground md:p-12">
            <div className="flex flex-1 flex-col justify-center">
              <MessageSquare className="mb-6 h-12 w-12" />
              <h2 className="mb-4 text-3xl font-bold">Request a Strategy Consultation</h2>
              <p className="mb-8 leading-relaxed opacity-80">
                Ready to modernize your enterprise infrastructure? Our team is standing by to help you design a solution that fits your unique scale and complexity.
              </p>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">1</div>
                  <span>Initial discovery call (30 mins)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">2</div>
                  <span>Technical feasibility assessment</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">3</div>
                  <span>Custom architecture proposal</span>
                </div>
              </div>
            </div>
            <div className="mt-8 md:mt-auto">
              <p className="text-xs opacity-80">
                We will contact you within 1 business day.
              </p>
              <p className="mt-6 border-t border-white/15 pt-6 text-xs opacity-80">
                Your information will be kept confidential.
              </p>
            </div>
          </div>
          
          <div className="p-8 md:p-12 flex-1">
            <Form {...form}>
              <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
                >
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Full Name <span className="text-white" aria-hidden>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Smith"
                          autoComplete="name"
                          maxLength={CONSULTATION_NAME_MAX_LENGTH}
                          {...field}
                          required
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormLabel className="col-start-1 row-start-1 text-foreground">
                          Email <span className="text-white" aria-hidden>*</span>
                        </FormLabel>
                        <FormControl className="col-start-1 row-start-2 mb-4">
                          <Input
                            type="email"
                            placeholder="john@company.com"
                            autoComplete="email"
                            maxLength={CONSULTATION_EMAIL_MAX_LENGTH}
                            {...field}
                            required
                            className="bg-secondary/50 border-border text-foreground"
                          />
                        </FormControl>
                        <FormMessage className="col-start-1 row-start-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormLabel className="col-start-1 row-start-4 text-foreground">
                          Phone (optional)
                        </FormLabel>
                        <FormControl className="col-start-1 row-start-5">
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={CONSULTATION_PHONE_MAX_LENGTH}
                            {...field}
                            onChange={(e) => {
                              field.onChange(formatPhoneNumber(e.target.value));
                            }}
                            className="bg-secondary/50 border-border text-foreground"
                          />
                        </FormControl>
                        <FormMessage
                          className={`col-start-1 ${hasPhone ? 'row-start-7' : 'row-start-6'}`}
                        />
                      </FormItem>
                    )}
                  />
                  {hasPhone && (
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem className="col-start-1 row-start-6 space-y-2">
                          <FormLabel className="text-foreground">
                            Timezone <span className="text-white" aria-hidden>*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                                <SelectValue placeholder="Select Your Timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                              {timezoneOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="preferredContact"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormLabel className="col-start-2 row-start-1 text-foreground">
                          Preferred
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="contents"
                          >
                            <div className="col-start-2 row-start-2 mb-4 flex h-10 items-center justify-center self-start">
                              <RadioGroupItem
                                value="e"
                                id="prefer-email"
                                aria-label="Preferred email contact"
                                className="border-2 border-border text-foreground"
                              />
                            </div>
                            <div className="col-start-2 row-start-5 flex h-10 items-center justify-center self-start">
                              <RadioGroupItem
                                value="p"
                                id="prefer-phone"
                                aria-label="Preferred phone contact"
                                className="border-2 border-border text-foreground"
                              />
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="col-start-2 row-start-6" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Company (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Global Corp"
                          maxLength={CONSULTATION_COMPANY_MAX_LENGTH}
                          {...field}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => {
                    const messageLength = field.value.length;
                    const atLimit = messageLength >= CONSULTATION_MESSAGE_MAX_LENGTH;

                    return (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          How can we help? <span className="text-white" aria-hidden>*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your enterprise challenges..."
                            className="min-h-[120px] bg-secondary/50 border-border text-foreground"
                            maxLength={CONSULTATION_MESSAGE_MAX_LENGTH}
                            {...field}
                            required
                          />
                        </FormControl>
                        <p
                          className={cn(
                            'text-right text-xs tabular-nums',
                            atLimit ? 'text-destructive' : 'text-muted-foreground'
                          )}
                          aria-live="polite"
                        >
                          {messageLength} / {CONSULTATION_MESSAGE_MAX_LENGTH}
                        </p>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {turnstileRequired && (
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    onToken={setTurnstileToken}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => setTurnstileToken('')}
                  />
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending…' : 'Submit Request'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
