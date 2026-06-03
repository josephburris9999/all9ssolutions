'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePortalSupportRealtime } from '@/hooks/use-portal-support-realtime';
import { formatPortalSupportMessageTime } from '@/lib/portal-support-format';
import { mergePortalSupportMessages } from '@/lib/portal-support-realtime';
import {
  PORTAL_SUPPORT_MESSAGE_MAX_LENGTH,
  portalSupportMessageSchema,
} from '@/lib/portal-support-schema';
import type { PortalSupportMessage } from '@/lib/portal-support-data';
import { isSupabaseRealtimeConfigured } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalSupportAudience = 'client' | 'admin';

type PortalSupportSectionProps = {
  initialMessages: PortalSupportMessage[];
  initialProgressId: string | null;
  timeZone: string | null;
  /** When set, messages are scoped to this client project. */
  projectId?: string | null;
  /** @deprecated Prefer `audience` — overrides the section description when set. */
  description?: string;
  audience?: PortalSupportAudience;
};

function MessageBubble({
  message,
  timeZone,
  audience,
}: {
  message: PortalSupportMessage;
  timeZone: string | null;
  audience: PortalSupportAudience;
}) {
  const isClient = message.kind === 'REQUEST';
  const senderLabel = isClient
    ? audience === 'admin'
      ? 'Client'
      : 'You'
    : 'all9s Solutions';
  const timestamp = formatPortalSupportMessageTime(message.createdAt, timeZone);

  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
          isClient
            ? 'border-primary/30 bg-primary/10'
            : 'border-border bg-secondary/40'
        }`}
      >
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold text-foreground">{senderLabel}</span>
          <time dateTime={message.createdAt} className="text-[11px] text-muted-foreground">
            {timestamp}
          </time>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.body}</p>
      </div>
    </div>
  );
}

export function PortalSupportSection({
  initialMessages,
  initialProgressId,
  timeZone,
  projectId,
  description,
  audience = 'client',
}: PortalSupportSectionProps) {
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [messages, setMessages] = useState(initialMessages);
  const [progressId, setProgressId] = useState(initialProgressId);
  const [body, setBody] = useState('');
  const realtimeEnabled = isSupabaseRealtimeConfigured();
  const isAdmin = audience === 'admin';
  const sectionDescription =
    description ??
    (isAdmin
      ? `Messages from all9s Solutions to the client. Replies from the client will appear here${
          realtimeEnabled ? ' in real time' : ''
        }.`
      : `Send questions and updates to all9s Solutions. Replies from our team will appear here${
          realtimeEnabled ? ' in real time' : ''
        }.`);
  const emptyMessage = isAdmin
    ? 'No messages yet. Send a message to the client below.'
    : 'No messages yet. Start a conversation with all9s Solutions below.';
  const messageFieldLabel = isAdmin ? 'Message to client' : 'Your message';
  const messagePlaceholder = isAdmin
    ? 'Send an update or reply to the client about their project…'
    : 'Ask a question or share an update about your project…';
  const sentToastDescription = isAdmin
    ? 'Your message was sent. The client can view it in their portal.'
    : 'all9s Solutions will reply here in your portal.';

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setProgressId(initialProgressId);
  }, [initialProgressId]);

  const handleRealtimeMessage = useCallback((message: PortalSupportMessage) => {
    setMessages((current) => mergePortalSupportMessages(current, message));
  }, []);

  usePortalSupportRealtime({
    progressId,
    onMessage: handleRealtimeMessage,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = portalSupportMessageSchema.safeParse({ body });
    if (!parsed.success) {
      toast({
        variant: 'destructive',
        title: 'Unable to send message',
        description: parsed.error.issues[0]?.message ?? 'Please check your message and try again.',
      });
      return;
    }

    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/support-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: parsed.data.body,
          ...(projectId ? { projectId } : {}),
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        progressId?: string;
        message?: PortalSupportMessage;
      };

      if (!res.ok || !data.ok || !data.message) {
        toast({
          variant: 'destructive',
          title: 'Unable to send message',
          description: data.error ?? 'Please try again.',
        });
        return;
      }

      if (data.progressId) {
        setProgressId(data.progressId);
      }

      setMessages((current) => mergePortalSupportMessages(current, data.message!));
      setBody('');
      toast({
        title: 'Message sent',
        description: sentToastDescription,
      });
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Unable to send message',
        description: 'Network error. Please try again.',
      });
    });
  }

  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-support-heading">
      <h2 id="portal-support-heading" className="mb-2 text-2xl font-bold text-foreground">
        Messages
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">{sectionDescription}</p>

      <div className="rounded-lg border border-border bg-card p-6">
        {messages.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="mb-6 max-h-96 space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                timeZone={timeZone}
                audience={audience}
              />
            ))}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="portal-support-message">{messageFieldLabel}</Label>
            <Textarea
              id="portal-support-message"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={messagePlaceholder}
              rows={4}
              maxLength={PORTAL_SUPPORT_MESSAGE_MAX_LENGTH}
              disabled={isSubmitting}
              className="border-border bg-secondary/30 text-foreground"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || body.trim().length < 10}>
            <Send className="size-4" aria-hidden />
            {isSubmitting ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </div>
    </section>
  );
}
