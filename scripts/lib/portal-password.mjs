import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

export function createId() {
  const t = Date.now().toString(36);
  const r = randomBytes(8).toString('hex');
  return `c${t}${r}`.slice(0, 25);
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/** Meets portal password policy (8+ chars, upper, number, special). */
export function generateTemporaryPassword() {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = lower + upper + digits + special;

  const pick = (chars) => chars[randomBytes(1)[0] % chars.length];
  const rest = Array.from({ length: 8 }, () => pick(all)).join('');

  return `${pick(upper)}${pick(lower)}${pick(digits)}${pick(special)}${rest}`;
}

export function getDatabaseUrl() {
  return process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? null;
}
