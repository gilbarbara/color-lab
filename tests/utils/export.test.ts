import {
  colorFormatLabels,
  colorFormats,
  formatColorValue,
  formatTypeLabels,
  formatTypes,
  generateCSS,
  generateExport,
  generatePaletteExport,
  generateSCSS,
  generateSVG,
  generateTailwind3,
  generateTailwind4,
  getAvailableColorFormats,
  isColorFormatAvailable,
} from '~/utils/export';

import type { ExportFormatType, ScaleSteps } from '~/types';

describe('utils/export', () => {
  // Sample tones for testing
  const sampleTones: ScaleSteps = {
    '50': '#fef5fd',
    '100': '#fcebfb',
    '500': '#d85dc5',
    '900': '#69265a',
  };

  // Sample OKLCH tones for testing wide gamut
  const oklchTones: ScaleSteps = {
    '50': 'oklch(97.94% 0.01 329.12)',
    '100': 'oklch(95.81% 0.03 327.58)',
    '500': 'oklch(66.72% 0.20 333.92)',
    '900': 'oklch(38.67% 0.12 337.33)',
  };

  describe('formatColorValue', () => {
    it('converts hex to oklch', () => {
      const result = formatColorValue('#ff0044', 'oklch');

      expect(result).toMatch(/^oklch\(.+\)$/);
    });

    it('converts hex to hsl', () => {
      const result = formatColorValue('#ff0044', 'hsl');

      expect(result).toMatch(/^hsl\(.+\)$/);
    });

    it('converts hex to rgb', () => {
      const result = formatColorValue('#ff0044', 'rgb');

      expect(result).toMatch(/^rgb\(.+\)$/);
    });

    it('converts hex to rgb-channels (space-separated)', () => {
      const result = formatColorValue('#ff0044', 'rgb-channels');

      expect(result).toMatch(/^\d+ \d+ \d+$/);
    });

    it('returns hex directly for hex format', () => {
      const result = formatColorValue('#ff0044', 'hex');

      expect(result).toBe('#ff0044');
    });

    it('preserves oklch format for oklch input', () => {
      const result = formatColorValue('oklch(63.269% 0.25404 19.90218)', 'oklch');

      expect(result).toMatch(/^oklch\(.+\)$/);
    });

    it('converts oklch to hex (clamps wide gamut)', () => {
      const result = formatColorValue('oklch(63.269% 0.25404 19.90218)', 'hex');

      expect(result).toMatch(/^#[\da-f]{6}$/i);
    });
  });

  describe('generateTailwind3', () => {
    it('generates JS object format with hex values', () => {
      const result = generateTailwind3('Plum', sampleTones, 'hex');

      expect(result).toContain("'plum': {");
      expect(result).toContain("'50': '#fef5fd'");
      expect(result).toContain("'500': '#d85dc5'");
      expect(result).toContain('},');
    });

    it('generates JS object format with oklch values', () => {
      const result = generateTailwind3('Plum', sampleTones, 'oklch');

      expect(result).toContain("'plum': {");
      expect(result).toContain("'50': 'oklch(");
    });

    it('normalizes color name with spaces', () => {
      const result = generateTailwind3('My Color', sampleTones, 'hex');

      expect(result).toContain("'my-color': {");
    });
  });

  describe('generateTailwind4', () => {
    it('generates CSS custom properties with --color- prefix', () => {
      const result = generateTailwind4('Plum', sampleTones, 'hex');

      expect(result).toContain('--color-plum-50: #fef5fd;');
      expect(result).toContain('--color-plum-500: #d85dc5;');
    });

    it('generates oklch values when specified', () => {
      const result = generateTailwind4('Plum', sampleTones, 'oklch');

      expect(result).toContain('--color-plum-50: oklch(');
    });
  });

  describe('generateCSS', () => {
    it('generates CSS custom properties', () => {
      const result = generateCSS('Plum', sampleTones, 'hex');

      expect(result).toContain('--plum-50: #fef5fd;');
      expect(result).toContain('--plum-500: #d85dc5;');
    });

    it('generates rgb-channels format', () => {
      const result = generateCSS('Plum', sampleTones, 'rgb-channels');

      expect(result).toMatch(/--plum-50: \d+ \d+ \d+;/);
    });
  });

  describe('generateSCSS', () => {
    it('generates SCSS variables', () => {
      const result = generateSCSS('Plum', sampleTones, 'hex');

      expect(result).toContain('$plum-50: #fef5fd;');
      expect(result).toContain('$plum-500: #d85dc5;');
    });

    it('generates rgb-channels format', () => {
      const result = generateSCSS('Plum', sampleTones, 'rgb-channels');

      expect(result).toMatch(/\$plum-50:(?: \d+){3};/);
    });
  });

  describe('generateSVG', () => {
    it('generates SVG with colored rectangles', () => {
      const result = generateSVG('Plum', sampleTones);

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).toContain('<rect');
      expect(result).toContain('fill="#fef5fd"');
      expect(result).toContain('fill="#d85dc5"');
    });

    it('calculates correct width based on tone count', () => {
      const result = generateSVG('Plum', sampleTones);

      // 4 tones * 100px = 400px width
      expect(result).toContain('width="400"');
      expect(result).toContain('viewBox="0 0 400 100"');
    });

    it('converts oklch tones to hex for SVG', () => {
      const result = generateSVG('Plum', oklchTones);

      // SVG should have hex colors, not oklch
      expect(result).not.toContain('oklch(');
      expect(result).toMatch(/fill="#[\da-f]{6}"/i);
    });
  });

  describe('generateExport', () => {
    it('delegates to correct generator based on format type', () => {
      const tailwind3 = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'tailwind3',
      });

      expect(tailwind3).toContain("'plum': {");

      const css = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'css',
      });

      expect(css).toContain('--plum-');
      expect(css).not.toContain("'plum': {");
    });

    it('generates tailwind4 format', () => {
      const result = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'tailwind4',
      });

      expect(result).toContain('--color-plum-50:');
    });

    it('generates scss format', () => {
      const result = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'scss',
      });

      expect(result).toContain('$plum-50:');
    });

    it('generates svg format', () => {
      const result = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'svg',
      });

      expect(result).toContain('<svg');
      expect(result).toContain('<title>Plum</title>');
    });

    it('returns empty string for unknown format type', () => {
      const result = generateExport('Plum', sampleTones, {
        colorFormat: 'hex',
        formatType: 'unknown' as ExportFormatType,
      });

      expect(result).toBe('');
    });
  });

  describe('generatePaletteExport', () => {
    const samplePalette = [
      { name: 'Primary', steps: sampleTones },
      { name: 'Secondary', steps: { '50': '#f0f9ff', '500': '#0ea5e9', '900': '#0c4a6e' } },
    ];

    it('generates tailwind3 format for palette', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'tailwind3',
      });

      expect(result).toContain('// Primary');
      expect(result).toContain("'primary': {");
      expect(result).toContain('// Secondary');
      expect(result).toContain("'secondary': {");
    });

    it('generates tailwind4 format for palette', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'tailwind4',
      });

      expect(result).toContain('/* Primary */');
      expect(result).toContain('--color-primary-50:');
      expect(result).toContain('/* Secondary */');
      expect(result).toContain('--color-secondary-50:');
    });

    it('generates css format for palette', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'css',
      });

      expect(result).toContain('/* Primary */');
      expect(result).toContain('--primary-50:');
      expect(result).toContain('/* Secondary */');
      expect(result).toContain('--secondary-50:');
    });

    it('generates scss format for palette', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'scss',
      });

      expect(result).toContain('/* Primary */');
      expect(result).toContain('$primary-50:');
      expect(result).toContain('/* Secondary */');
      expect(result).toContain('$secondary-50:');
    });

    it('generates svg format for palette with stacked rows', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'svg',
      });

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).toContain('<text');
      expect(result).toContain('>Primary</text>');
      expect(result).toContain('>Secondary</text>');
      expect(result).toContain('<rect');
    });

    it('returns empty string for unknown format type', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'unknown' as ExportFormatType,
      });

      expect(result).toBe('');
    });

    it('respects color format option', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'oklch',
        formatType: 'css',
      });

      expect(result).toContain('oklch(');
    });
  });

  describe('isColorFormatAvailable', () => {
    it('allows all formats for tailwind3', () => {
      expect(isColorFormatAvailable('tailwind3', 'oklch')).toBe(true);
      expect(isColorFormatAvailable('tailwind3', 'hex')).toBe(true);
      expect(isColorFormatAvailable('tailwind3', 'hsl')).toBe(true);
      expect(isColorFormatAvailable('tailwind3', 'rgb')).toBe(true);
      expect(isColorFormatAvailable('tailwind3', 'rgb-channels')).toBe(false);
    });

    it('allows rgb-channels only for css and scss', () => {
      expect(isColorFormatAvailable('css', 'rgb-channels')).toBe(true);
      expect(isColorFormatAvailable('scss', 'rgb-channels')).toBe(true);
      expect(isColorFormatAvailable('tailwind3', 'rgb-channels')).toBe(false);
      expect(isColorFormatAvailable('tailwind4', 'rgb-channels')).toBe(false);
    });

    it('only allows hex for svg', () => {
      expect(isColorFormatAvailable('svg', 'hex')).toBe(true);
      expect(isColorFormatAvailable('svg', 'oklch')).toBe(false);
      expect(isColorFormatAvailable('svg', 'hsl')).toBe(false);
      expect(isColorFormatAvailable('svg', 'rgb')).toBe(false);
    });
  });

  describe('getAvailableColorFormats', () => {
    it('returns only hex for svg', () => {
      expect(getAvailableColorFormats('svg')).toEqual(['hex']);
    });

    it('includes rgb-channels for css and scss', () => {
      expect(getAvailableColorFormats('css')).toContain('rgb-channels');
      expect(getAvailableColorFormats('scss')).toContain('rgb-channels');
    });

    it('excludes rgb-channels for tailwind formats', () => {
      expect(getAvailableColorFormats('tailwind3')).not.toContain('rgb-channels');
      expect(getAvailableColorFormats('tailwind4')).not.toContain('rgb-channels');
    });
  });

  describe('constants', () => {
    it('has labels for all format types', () => {
      for (const type of formatTypes) {
        expect(formatTypeLabels[type]).toBeDefined();
        expect(typeof formatTypeLabels[type]).toBe('string');
      }
    });

    it('has labels for all color formats', () => {
      for (const format of colorFormats) {
        expect(colorFormatLabels[format]).toBeDefined();
        expect(typeof colorFormatLabels[format]).toBe('string');
      }
    });
  });

  describe('wide gamut color handling', () => {
    it('preserves oklch values when exporting to oklch format', () => {
      const result = generateTailwind3('Plum', oklchTones, 'oklch');

      // Should contain original oklch values (or normalized)
      expect(result).toContain('oklch(');
    });

    it('clamps to sRGB when exporting oklch tones to hex', () => {
      const result = generateTailwind3('Plum', oklchTones, 'hex');

      // Should contain hex values
      expect(result).toMatch(/'50': '#[\da-f]{6}'/i);
    });
  });
});
