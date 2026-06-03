export type TimezoneOption = {
  value: string;
  label: string;
};

/** IANA zones for Hawaii, Alaska, and the contiguous United States. */
export const US_TIMEZONE_IDS = [
  // Contiguous US — Eastern
  'America/New_York',
  'America/Detroit',
  'America/Indiana/Indianapolis',
  'America/Indiana/Marengo',
  'America/Indiana/Petersburg',
  'America/Indiana/Vevay',
  'America/Indiana/Vincennes',
  'America/Indiana/Winamac',
  'America/Kentucky/Louisville',
  'America/Kentucky/Monticello',
  // Contiguous US — Central
  'America/Chicago',
  'America/Indiana/Knox',
  'America/Indiana/Tell_City',
  'America/Menominee',
  'America/North_Dakota/Beulah',
  'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem',
  // Contiguous US — Mountain
  'America/Denver',
  'America/Boise',
  'America/Phoenix',
  // Contiguous US — Pacific
  'America/Los_Angeles',
  // Alaska
  'America/Anchorage',
  'America/Juneau',
  'America/Metlakatla',
  'America/Nome',
  'America/Sitka',
  'America/Yakutat',
  // Hawaii
  'Pacific/Honolulu',
] as const;

const FALLBACK_TIMEZONES: TimezoneOption[] = US_TIMEZONE_IDS.map((zone) => ({
  value: zone,
  label: zone.replace(/_/g, ' '),
}));

function formatTimezoneLabel(zone: string, now: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
    });
    const offset =
      formatter.formatToParts(now).find((part) => part.type === 'timeZoneName')?.value ?? '';
    const name = zone.replace(/_/g, ' ');
    return offset ? `${name} (${offset})` : name;
  } catch {
    return zone.replace(/_/g, ' ');
  }
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getTimezoneOptions(): TimezoneOption[] {
  const now = new Date();
  try {
    const supported = new Set(Intl.supportedValuesOf('timeZone'));
    return US_TIMEZONE_IDS.filter((zone) => supported.has(zone)).map((zone) => ({
      value: zone,
      label: formatTimezoneLabel(zone, now),
    }));
  } catch {
    return FALLBACK_TIMEZONES;
  }
}
