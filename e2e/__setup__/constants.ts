export const collapseDuration = 400;

// Window-scroll offset for the fixed 64px header + 16px padding, mirroring SCROLL_OFFSET
// in src/config/ui. Native scrollIntoView ignores the header, clipping the target's top.
export const scrollOffset = 80;

// Seed palettes.

// Not canonical, and useUrlSync rewrites it on mount — assert `Primary-73_0.23_321`, which is what
// basic.spec.ts does. formatOklchUrl rounds L to 2 decimals and C to 3, so `73.0` sheds its trailing
// zero and `0.23001` collapses to `0.23`. That is precision rounding, not gamut clamping: it happens
// under P3 and sRGB alike, so forcing P3 in the harness does not keep this URL still.
export const seedSingle = '/p/Primary-73.0_0.23001_321';

// oklch(60% 0.210 150) / oklch(60% 0.139 227) / oklch(60% 0.266 304). Canonical at the serializer's
// precision, so unlike seedSingle this URL stays put while the spec drives it. No name, no options —
// specs that need them apply them through the UI.
export const seedPalette = '/p/Primary-60_0.21_150/Secondary-60_0.139_227/Tertiary-60_0.266_304';
