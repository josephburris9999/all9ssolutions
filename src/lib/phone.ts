export const PHONE_DIGIT_COUNT = 10;

export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_DIGIT_COUNT);
}

export function formatPhoneNumber(value: string): string {
  const digits = getPhoneDigits(value);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isCompletePhoneNumber(value: string): boolean {
  return getPhoneDigits(value).length === PHONE_DIGIT_COUNT;
}
