import type { ColorGroupOptions, ColorSpacingOptions } from '~/types';

export const APCA_LIGHTNESS_CONTRAST = (
  <span>
    L<sup>c</sup>
  </span>
);

export const COLOR_GROUPS: ColorGroupOptions = {
  brand: { code: 'b', description: 'Your signature identity colors', label: 'Brand' },
  neutral: { code: 'n', description: 'Text, borders, surfaces, backgrounds', label: 'Neutral' },
  semantic: { code: 's', description: 'Success, warning, error, info', label: 'Semantic' },
  decorative: { code: 'd', description: 'Accents, charts, and highlights', label: 'Decorative' },
};

export const COLOR_SPACING: ColorSpacingOptions = {
  tight: {
    angle: 30,
    description: 'Small steps, close hues (30°)',
    label: 'Tight',
  },
  even: {
    angle: 36,
    description: 'Equal spread, full wheel (36°)',
    label: 'Even',
  },
  wide: {
    angle: 77,
    description: 'Wide spread, still cohesive (77°)',
    label: 'Wide',
  },
  golden: {
    angle: 137.5,
    description: 'Max spread, golden angle (137.5°)',
    label: 'Golden',
  },
};

export const DEFAULT_COLOR_NAMES = [
  'Primary',
  'Secondary',
  'Tertiary',
  'Accent',
  'Color 5',
  'Color 6',
  'Color 7',
  'Color 8',
  'Color 9',
  'Color 10',
];
export const DEFAULT_PALETTE_NAME = 'Color Palette';

export const MAX_COLORS = 10;

export const PALETTE_PATH_PREFIX = '/p';

// Storage
export const STORAGE_KEY = 'color-lab';

// Auth
export const AUTH_PROVIDER_KEY = 'colorLabAuthProvider';
export const AUTH_RETURN_URL_KEY = 'authReturnUrl';
export const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';

// Third-party
export const CONTACT_FORM_ENDPOINT = 'https://submit-form.com/OsJcU0zeI';
export const POSTHOG_UI_HOST = 'https://us.posthog.com';
