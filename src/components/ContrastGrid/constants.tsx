import type { ReactNode } from 'react';

import { APCA_LIGHTNESS_CONTRAST } from '~/config/globals';

export const WCAG_THRESHOLDS = [3, 4.5, 7, 'all'] as const;
export const APCA_THRESHOLDS = [15, 30, 45, 60, 75, 90, 'all'] as const;

export type ApcaThreshold = (typeof APCA_THRESHOLDS)[number];
export type Guideline = 'apca' | 'wcag2';
export type WcagThreshold = (typeof WCAG_THRESHOLDS)[number];

export const WCAG_DESCRIPTIONS: Record<Exclude<WcagThreshold, 'all'>, ReactNode> = {
  3: '3 • Minimum for large text (18pt+ or 14pt bold)',
  4.5: '4.5 • Minimum for body text and preferred for headings and titles',
  7: '7 • Enhanced (AAA) for body text',
};

export const APCA_DESCRIPTIONS: Record<Exclude<ApcaThreshold, 'all'>, ReactNode> = {
  15: <span>{APCA_LIGHTNESS_CONTRAST} 15 • Decorative text and dividers</span>,
  30: <span>{APCA_LIGHTNESS_CONTRAST} 30 • Large/fluent (non-content) text</span>,
  45: <span>{APCA_LIGHTNESS_CONTRAST} 45 • Large text minimum</span>,
  60: <span>{APCA_LIGHTNESS_CONTRAST} 60 • Small text (non-body), UI elements</span>,
  75: <span>{APCA_LIGHTNESS_CONTRAST} 75 • Body text minimum</span>,
  90: <span>{APCA_LIGHTNESS_CONTRAST} 90 • Body text preferred</span>,
};

export const APCA_LABELS: Record<ApcaThreshold, string> = {
  15: 'Decorative',
  30: 'Non-content',
  45: 'Large min',
  60: 'UI / Small',
  75: 'Body min',
  90: 'Body pref',
  all: 'All',
};

export const WCAG_LABELS: Record<WcagThreshold, string> = {
  3: 'AA Large',
  4.5: 'AA',
  7: 'AAA',
  all: 'All',
};
