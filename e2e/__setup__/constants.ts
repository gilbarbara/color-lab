export const collapseDuration = 400;

// Window-scroll offset for the fixed 64px header + 16px padding, mirroring SCROLL_OFFSET
// in src/config/globals. Native scrollIntoView ignores the header, clipping the target's top.
export const scrollOffset = 80;

// Seed palettes. Both are canonical (chroma within the P3 gamut at their lightness, no trailing
// zeros), so useUrlSync has nothing to rewrite and the URL stays put while the spec drives it.
export const seedSingle = '/p/Primary-73.0_0.23001_321';

// oklch(60% 0.210 150) / oklch(60% 0.139 227) / oklch(60% 0.266 304). No name, no options —
// specs that need them apply them through the UI.
export const seedPalette = '/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304';
