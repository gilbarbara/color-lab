import type { Gamut } from '~/types';

export function detectInitialGamut(): Gamut {
  return isP3Supported() ? 'p3' : 'srgb';
}

export function isP3Supported(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(color-gamut: p3)').matches;
}
