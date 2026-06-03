import { CONSULTATION_PHONE_MAX_LENGTH, CONSULTATION_TIMEZONE_MAX_LENGTH } from '@/lib/field-lengths';
import { getPhoneDigits } from '@/lib/phone';
import { isValidIanaTimeZone } from '@/lib/timezones';
import { z } from 'zod';

function addPhoneTimezoneIssues(
  data: { phone?: string; timezone?: string },
  ctx: z.RefinementCtx,
  phoneRequiredMessage: string
) {
  const phoneDigits = getPhoneDigits(data.phone ?? '');
  if (phoneDigits.length !== 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        phoneDigits.length === 0 ? phoneRequiredMessage : 'Enter a 10-digit phone number',
      path: ['phone'],
    });
  }

  const timezone = data.timezone?.trim() ?? '';
  if (timezone.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Timezone is required',
      path: ['timezone'],
    });
  } else if (!isValidIanaTimeZone(timezone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a valid timezone',
      path: ['timezone'],
    });
  }
}

export const portalAdminPreferredContactSchema = z
  .object({
    preferredContact: z.enum(['e', 'p'], {
      required_error: 'Select Email or Phone',
    }),
    phone: z.string().trim().max(CONSULTATION_PHONE_MAX_LENGTH).optional(),
    timezone: z.string().trim().max(CONSULTATION_TIMEZONE_MAX_LENGTH).optional(),
  })
  .superRefine((data, ctx) => {
    const updatingPhoneTimezone = data.phone !== undefined || data.timezone !== undefined;

    if (data.preferredContact === 'p') {
      addPhoneTimezoneIssues(
        data,
        ctx,
        'Phone number is required when phone is the preferred contact method'
      );
      return;
    }

    if (updatingPhoneTimezone) {
      addPhoneTimezoneIssues(data, ctx, 'Phone number is required');
    }
  });

export type PortalAdminPreferredContactValues = z.infer<typeof portalAdminPreferredContactSchema>;
