import { randomBytes } from 'crypto';

/** Meets portal password policy (8+ chars, upper, lower, number, special). */
export function generateTemporaryPortalPassword(): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = lower + upper + digits + special;

  const pick = (chars: string) => chars[randomBytes(1)[0]! % chars.length];
  const rest = Array.from({ length: 8 }, () => pick(all)).join('');

  return `${pick(upper)}${pick(lower)}${pick(digits)}${pick(special)}${rest}`;
}
