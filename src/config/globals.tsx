import type { ColorSpacingOptions } from '~/types';

export const APCA_LIGHTNESS_CONTRAST = (
  <span>
    L<sup>c</sup>
  </span>
);

export const BREAKPOINTS = { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 };

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

export const HEADER_HEIGHT = 64;
export const OFFSET = 16;
export const SCROLL_OFFSET = HEADER_HEIGHT + OFFSET;

export const MODAL_GAP = 24;
export const MODAL_BODY_PADDING = 32;
export const MODAL_MIN_WIDTH = 480;

export const ROUTER_NAVIGATION_OPTIONS = { scroll: false } as const;
