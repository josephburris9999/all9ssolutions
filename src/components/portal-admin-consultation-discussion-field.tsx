'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CONSULTATION_DISCUSSION_MAX_LENGTH } from '@/lib/field-lengths';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalAdminConsultationDiscussionFieldProps = {
  consultationRequestId: string;
  initialDiscussion: {
    body: string;
    updatedAt: string;
  } | null;
  editable: boolean;
  onDiscussionSaved?: (discussion: { body: string; updatedAt: string }) => void;
};

export function PortalAdminConsultationDiscussionField({
  consultationRequestId,
  initialDiscussion,
  editable,
  onDiscussionSaved,
}: PortalAdminConsultationDiscussionFieldProps) {
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [savedBody, setSavedBody] = useState(initialDiscussion?.body ?? '');
  const [body, setBody] = useState(initialDiscussion?.body ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    const nextBody = initialDiscussion?.body ?? '';
    setSavedBody(nextBody);
    setBody(nextBody);
  }, [initialDiscussion]);

  const remaining = CONSULTATION_DISCUSSION_MAX_LENGTH - body.length;
  const isDirty = body !== savedBody;
  const canSave =
    editable && isDirty && body.trim().length > 0 && body.length <= CONSULTATION_DISCUSSION_MAX_LENGTH;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editable) {
      return;
    }

    const trimmed = body.trim();
    if (!trimmed) {
      setFieldError('Client discussion is required');
      return;
    }

    if (body.length > CONSULTATION_DISCUSSION_MAX_LENGTH) {
      setFieldError(
        `Client discussion must be at most ${CONSULTATION_DISCUSSION_MAX_LENGTH} characters`
      );
      return;
    }

    setFieldError(null);

    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/discussion`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        }
      );

      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        discussion?: { body: string; updatedAt: string };
      };

      if (!res.ok || !payload.ok || !payload.discussion) {
        toast({
          variant: 'destructive',
          title: 'Could not save client discussion',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      setSavedBody(payload.discussion.body);
      setBody(payload.discussion.body);
      onDiscussionSaved?.(payload.discussion);
      toast({
        title: 'Client discussion saved',
      });
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not save client discussion',
        description: 'Please check your connection and try again.',
      });
    });
  }

  return (
    <form className="mt-6 space-y-4 border-t border-border pt-6" onSubmit={handleSave}>
      <div className="space-y-2">
        <Label htmlFor={`client-discussion-${consultationRequestId}`}>Client Discussion</Label>
        <Textarea
          id={`client-discussion-${consultationRequestId}`}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            if (fieldError) {
              setFieldError(null);
            }
          }}
          maxLength={CONSULTATION_DISCUSSION_MAX_LENGTH}
          required={editable}
          readOnly={!editable}
          disabled={!editable || isSubmitting}
          rows={8}
          placeholder="Capture internal notes and discussion about this consultation request…"
          className={cn('min-h-[10rem] resize-y', !editable && 'bg-muted/30')}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={`client-discussion-count-${consultationRequestId}`}
        />
        <p
          id={`client-discussion-count-${consultationRequestId}`}
          className={cn(
            'text-right text-xs tabular-nums',
            remaining <= 0 ? 'text-destructive' : 'text-muted-foreground'
          )}
          aria-live="polite"
        >
          {remaining.toLocaleString()} remaining
        </p>
        {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
        {!editable ? (
          <p className="text-sm text-muted-foreground">
            Client discussion is locked after a project is created for this request.
          </p>
        ) : null}
      </div>
      {editable ? (
        <Button type="submit" disabled={!canSave || isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Discussion'}
        </Button>
      ) : null}
    </form>
  );
}
