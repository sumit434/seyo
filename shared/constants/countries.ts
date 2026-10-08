export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  flagEmoji: string;
  defaultTimezone: string;
  timezones: string[];
  phoneLength: number;
}

export const ALLOWED_COUNTRIES: CountryConfig[] = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flagEmoji: '🇺🇸',
    defaultTimezone: 'America/New_York',
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
    phoneLength: 10,
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    flagEmoji: '🇨🇳',
    defaultTimezone: 'Asia/Shanghai',
    timezones: ['Asia/Shanghai', 'Asia/Urumqi'],
    phoneLength: 11,
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flagEmoji: '🇩🇪',
    defaultTimezone: 'Europe/Berlin',
    timezones: ['Europe/Berlin'],
    phoneLength: 10,
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flagEmoji: '🇯🇵',
    defaultTimezone: 'Asia/Tokyo',
    timezones: ['Asia/Tokyo'],
    phoneLength: 10,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flagEmoji: '🇬🇧',
    defaultTimezone: 'Europe/London',
    timezones: ['Europe/London'],
    phoneLength: 10,
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flagEmoji: '🇮🇳',
    defaultTimezone: 'Asia/Kolkata',
    timezones: ['Asia/Kolkata'],
    phoneLength: 10,
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flagEmoji: '🇫🇷',
    defaultTimezone: 'Europe/Paris',
    timezones: ['Europe/Paris'],
    phoneLength: 9,
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flagEmoji: '🇮🇹',
    defaultTimezone: 'Europe/Rome',
    timezones: ['Europe/Rome'],
    phoneLength: 10,
  },
  {
    code: 'RU',
    name: 'Russia',
    dialCode: '+7',
    flagEmoji: '🇷🇺',
    defaultTimezone: 'Europe/Moscow',
    timezones: ['Europe/Moscow', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok'],
    phoneLength: 10,
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    flagEmoji: '🇧🇷',
    defaultTimezone: 'America/Sao_Paulo',
    timezones: ['America/Sao_Paulo', 'America/Manaus', 'America/Belem'],
    phoneLength: 11,
  },
];

export const ALLOWED_COUNTRY_NAMES = ALLOWED_COUNTRIES.map(c => c.name);

export function getCountryPhoneLength(dialCodeOrCode: string): number {
  if (!dialCodeOrCode) return 10;
  const clean = dialCodeOrCode.trim();
  const found = ALLOWED_COUNTRIES.find(
    c => c.dialCode === clean || c.code.toLowerCase() === clean.toLowerCase() || clean.startsWith(c.dialCode)
  );
  return found?.phoneLength || 10;
}
