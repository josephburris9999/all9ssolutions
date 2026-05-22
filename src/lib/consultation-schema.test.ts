import { describe, expect, it } from 'vitest';
import { consultationFormSchema, consultationSubmitSchema } from './consultation-schema';

const validForm = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '',
  timezone: '',
  preferredContact: 'e' as const,
  company: '',
  message: 'We need help modernizing our data platform.',
};

describe('consultationFormSchema', () => {
  it('accepts a valid email-preferred submission', () => {
    const result = consultationFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('requires phone when phone is the preferred contact method', () => {
    const result = consultationFormSchema.safeParse({
      ...validForm,
      preferredContact: 'p',
      phone: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('phone'))).toBe(true);
    }
  });

  it('requires timezone when a complete phone number is provided', () => {
    const result = consultationFormSchema.safeParse({
      ...validForm,
      phone: '(555) 123-4567',
      timezone: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('timezone'))).toBe(true);
    }
  });

  it('accepts phone with timezone', () => {
    const result = consultationFormSchema.safeParse({
      ...validForm,
      phone: '(555) 123-4567',
      timezone: 'America/Chicago',
    });
    expect(result.success).toBe(true);
  });
});

describe('consultationSubmitSchema', () => {
  it('extends the form schema with bot-protection fields', () => {
    const startedAt = Math.floor(Date.now() / 1000) - 60;
    const result = consultationSubmitSchema.safeParse({
      ...validForm,
      website: '',
      _formStartedAt: startedAt,
    });
    expect(result.success).toBe(true);
  });

  it('requires _formStartedAt', () => {
    const result = consultationSubmitSchema.safeParse({
      ...validForm,
      website: '',
    });
    expect(result.success).toBe(false);
  });
});
