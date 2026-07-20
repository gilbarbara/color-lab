import { createPalette } from '~/utils/generator';
import { serializePaletteToUrl } from '~/utils/url';

import type { OklchString } from '~/types';

const baseColor = 'oklch(62.3% 0.214 259.815)' as OklchString;

/** Generator link seeded with a neutral demo color at default (even) options. */
export const generatorHref = serializePaletteToUrl(createPalette(baseColor));

export const SCALE_SWATCHES: string[] = [
  'oklch(0.97 0.02 264)',
  'oklch(0.92 0.05 264)',
  'oklch(0.84 0.1 264)',
  'oklch(0.74 0.16 264)',
  'oklch(0.64 0.21 264)',
  'oklch(0.55 0.22 264)',
  'oklch(0.48 0.19 264)',
  'oklch(0.4 0.16 264)',
  'oklch(0.33 0.13 264)',
  'oklch(0.26 0.1 264)',
  'oklch(0.2 0.07 264)',
];

export const PALETTE_SWATCHES: string[] = [
  'oklch(0.62 0.21 264)',
  'oklch(0.7 0.14 195)',
  'oklch(0.75 0.16 150)',
  'oklch(0.82 0.15 90)',
  'oklch(0.65 0.2 30)',
  'oklch(0.55 0.2 330)',
];

export interface Tool {
  /** Description paragraphs: identity first, then details. */
  description: string[];
  /** The point after the bolded lead. */
  diffBody: string;
  /** Bolded lead of the differentiator line. */
  diffLead: string;
  href: string;
  mine?: boolean;
  name: string;
  /** Working-surface screenshot, seeded with the same brief color across tools. */
  src: string;
}

// Listicle order: accessible, then specialized, then minimal, then mine last.
// Each screenshot is the tool's real working surface, not a landing hub.
export const TOOLS: Tool[] = [
  {
    name: 'tints.dev',
    href: 'https://www.tints.dev/',
    src: '/images/comparison/tints.png',
    description: [
      'A Tailwind-first generator with a public API: paste a color, get an 11-step 50–950 ramp, and pull it into a build over HTTP.',
      'It works in a perceptual mode and outputs Tailwind 3 config or Tailwind 4 @theme in oklch, hex, p3, or hsl, with several named palettes at once. Open source, free, and about as fast as this gets.',
    ],
    diffLead: 'Speed over checks.',
    diffBody:
      'No contrast or gamut tooling, and you judge the ramp as swatches and a distribution plot, never on your own interface.',
  },
  {
    name: 'uicolors',
    href: 'https://uicolors.app/',
    src: '/images/comparison/uicolors.png',
    description: [
      'A polished Tailwind generator with the best previews in the set: your ramp rendered live across cards, dashboards, marketing layouts, and shadcn/ui components.',
      'It anchors your color to the nearest step and splits work into Brand, Neutral, and Status scales with semantic naming. It looks like a full multi-scale system, and on the free tier you can see most of it without building it.',
    ],
    diffLead: 'Most of it is Pro.',
    diffBody:
      'A second scale, the contrast matrix, and CSS/oklch export are paywalled, so the free tier is one good-looking ramp.',
  },
  {
    name: 'Leonardo',
    href: 'https://leonardocolor.io/',
    src: '/images/comparison/leonardo.png',
    description: [
      'Adobe-born and open source, Leonardo runs the process backwards: instead of picking colors and checking them, you set a WCAG contrast target for each step and it solves the color that hits it against a chosen background.',
      'It interpolates through key colors in CAM02, Lab, or OKLCH, and exports CSS custom properties, W3C design tokens, or JS. The same engine also ships as an npm library.',
    ],
    diffLead: 'You think like a color scientist.',
    diffBody:
      'It works in key colors, interpolation curves, and steps named by contrast rather than 50–950, and you judge the result on charts instead of a live interface.',
  },
  {
    name: 'Huetone',
    href: 'https://huetone.ardov.me/',
    src: '/images/comparison/huetone.png',
    description: [
      'A perceptual-tuning workbench built around one big matrix: every hue is a row and every tone a column, and you hand-draw the lightness, chroma, and hue curves while WCAG and APCA update on every cell.',
      'It works across sRGB, P3, and Rec.2020, and exports CSS variables and Figma tokens. No tool here gives you finer control over the exact shape of a ramp.',
    ],
    diffLead: 'Control behind a wall.',
    diffBody:
      'A hue matrix and four curve editors greet you before you’ve done anything, a lot to face for a first ramp.',
  },
  {
    name: 'hihayk Scale',
    href: 'https://hihayk.github.io/scale/',
    src: '/images/comparison/hihayk.png',
    description: [
      'The minimalist: a base color, eight knobs that push the light and dark ends on their own (amount, darkness, lightness, hue angle, saturation), and a live row of swatches that redraws as you drag.',
      'Copy the result as a hex list or an SVG. There is almost nothing to configure, which is the point.',
    ],
    diffLead: 'A sketchpad, not a system.',
    diffBody:
      'No step names, no contrast, one scale at a time, but the fastest way to a rough ramp.',
  },
  {
    name: 'ColorMeUp Lab',
    href: '/',
    mine: true,
    src: '/images/comparison/colormeup-lab.png',
    description: [
      'An OKLCH scale generator that turns one seed color into a coherent primary, neutral, and error system, verified against WCAG and APCA and gamut-checked step by step.',
      'Paste a color and the full scale plus a live component preview land on the first screen, with the curves, gamut view, and contrast matrix behind Advanced Options. Export is paste-ready to Tailwind, CSS, or oklch(), and it’s free and open source.',
    ],
    diffLead: 'Capable without the cockpit.',
    diffBody:
      'The only tool here pairing a gamut-honest, contrast-verified system with a UI you don’t have to study first, free and open source. Where it loses is in the table below: no generating to a contrast target, no color-blind simulation.',
  },
];

// Column order matches the listicle above, ColorMeUp Lab last and highlighted as
// the subject. Its losses still show in the same rows as everyone else.
export const TABLE_COLUMNS = [
  'tints.dev',
  'uicolors',
  'Leonardo',
  'Huetone',
  'hihayk',
  'ColorMeUp Lab',
] as const;

type Status = 'yes' | 'partial' | 'no';

interface StatusRow {
  cells: Status[];
  kind: 'status';
  label: string;
}

interface TextRow {
  cells: string[];
  kind: 'text';
  label: string;
}

export type TableRow = TextRow | StatusRow;

// Verified first-hand on 2026-07-18; sources in the research record. Order of cells
// matches TABLE_COLUMNS: tints.dev, uicolors, Leonardo, Huetone, hihayk, ColorMeUp Lab.
export const TABLE_ROWS: TableRow[] = [
  {
    kind: 'text',
    label: 'Color model',
    cells: ['HSL → oklch', 'HSL', 'CAM02 / Lab', 'CIE Lab', 'HSL', 'OKLCH'],
  },
  {
    kind: 'text',
    label: 'Steps · naming',
    cells: [
      '11 · 50–950',
      '11 · 50–950',
      'contrast-derived',
      '9 · 50–800',
      'adjustable',
      '11 · 50–950',
    ],
  },
  {
    kind: 'status',
    label: 'WCAG contrast',
    cells: ['no', 'partial', 'yes', 'yes', 'no', 'yes'],
  },
  { kind: 'status', label: 'APCA', cells: ['no', 'partial', 'yes', 'yes', 'no', 'yes'] },
  {
    kind: 'status',
    label: 'Generate to a contrast target',
    cells: ['no', 'no', 'yes', 'no', 'no', 'no'],
  },
  {
    kind: 'status',
    label: 'Color-blind simulation',
    cells: ['no', 'no', 'no', 'no', 'no', 'no'],
  },
  {
    kind: 'status',
    label: 'Per-tone curve control',
    cells: ['partial', 'no', 'yes', 'yes', 'partial', 'partial'],
  },
  {
    kind: 'status',
    label: 'Gamut check (P3 / sRGB)',
    cells: ['no', 'no', 'no', 'yes', 'no', 'yes'],
  },
  {
    kind: 'status',
    label: 'Multiple scales at once',
    cells: ['yes', 'partial', 'yes', 'yes', 'no', 'yes'],
  },
  {
    kind: 'status',
    label: 'Tailwind export',
    cells: ['yes', 'yes', 'no', 'no', 'no', 'yes'],
  },
  {
    kind: 'status',
    label: 'oklch() export',
    cells: ['yes', 'partial', 'no', 'partial', 'no', 'yes'],
  },
  {
    kind: 'status',
    label: 'Public / hosted API',
    cells: ['yes', 'partial', 'no', 'no', 'no', 'no'],
  },
  {
    kind: 'status',
    label: 'Open source',
    cells: ['yes', 'no', 'yes', 'yes', 'partial', 'yes'],
  },
  {
    kind: 'status',
    label: 'Free (core unlocked)',
    cells: ['yes', 'partial', 'yes', 'yes', 'yes', 'yes'],
  },
];
