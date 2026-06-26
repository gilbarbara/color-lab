import { BLUE_SCALE, CRIMSON, PLUM_SCALE } from '~/test-fixtures';
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
} from '~/utils/export';

import type { ExportFormatType } from '~/types';

describe('utils/export', () => {
  describe('formatColorValue', () => {
    it('converts oklch to oklch (canonical form)', () => {
      const result = formatColorValue(CRIMSON, 'oklch');

      expect(result).toMatch(/^oklch\(.+\)$/);
    });

    it('converts oklch to hsl', () => {
      const result = formatColorValue(CRIMSON, 'hsl');

      expect(result).toMatch(/^hsl\(.+\)$/);
    });

    it('converts oklch to rgb', () => {
      const result = formatColorValue(CRIMSON, 'rgb');

      expect(result).toMatch(/^rgb\(.+\)$/);
    });

    it('converts oklch to rgb-channels (space-separated)', () => {
      const result = formatColorValue(CRIMSON, 'rgb-channels');

      expect(result).toMatch(/^\d+ \d+ \d+$/);
    });

    it('converts oklch to hex', () => {
      const result = formatColorValue(CRIMSON, 'hex');

      expect(result).toMatch(/^#[\da-f]{6}$/i);
    });

    it('preserves oklch format for oklch input', () => {
      const result = formatColorValue(CRIMSON, 'oklch');

      expect(result).toMatch(/^oklch\(.+\)$/);
    });

    it('converts oklch to hex (clamps wide gamut)', () => {
      const result = formatColorValue(CRIMSON, 'hex');

      expect(result).toMatch(/^#[\da-f]{6}$/i);
    });
  });

  describe('generateTailwind3', () => {
    it('generates JS object format with hex values', () => {
      const result = generateTailwind3('Plum', PLUM_SCALE, 'hex');

      expect(result).toMatchSnapshot();
    });

    it('generates JS object format with oklch values', () => {
      const result = generateTailwind3('Plum', PLUM_SCALE, 'oklch');

      expect(result).toMatchSnapshot();
    });

    it('normalizes color name with spaces', () => {
      const result = generateTailwind3('My Color', PLUM_SCALE, 'hex');

      expect(result).toContain("'my-color': {");
    });
  });

  describe('generateTailwind4', () => {
    it('generates CSS custom properties with --color- prefix', () => {
      const result = generateTailwind4('Plum', PLUM_SCALE, 'hex');

      expect(result).toMatchSnapshot();
    });

    it('generates oklch values when specified', () => {
      const result = generateTailwind4('Plum', PLUM_SCALE, 'oklch');

      expect(result).toMatchSnapshot();
    });
  });

  describe('generateCSS', () => {
    it('generates CSS custom properties', () => {
      const result = generateCSS('Plum', PLUM_SCALE, 'hex');

      expect(result).toMatchSnapshot();
    });

    it('generates rgb-channels format', () => {
      const result = generateCSS('Plum', PLUM_SCALE, 'rgb-channels');

      expect(result).toMatchSnapshot();
    });
  });

  describe('normalizeColorName (via generateCSS)', () => {
    it('preserves Unicode letters (accents)', () => {
      const result = generateCSS('Açaí', PLUM_SCALE, 'hex');

      expect(result).toContain('--color-açaí-');
    });

    it('strips CSS-dangerous characters from variable names', () => {
      const result = generateCSS('red; }', PLUM_SCALE, 'hex');
      const varNames = [...result.matchAll(/--([^:]+):/g)].map(m => m[1]);

      expect(varNames.every(n => !/[;<>{}]/.test(n))).toBe(true);
      expect(varNames[0]).toBe('color-red-50');
    });

    it('collapses whitespace and trims edge hyphens', () => {
      const result = generateCSS('  Bold   Red  ', PLUM_SCALE, 'hex');

      expect(result).toContain('--color-bold-red-');
    });

    it('falls back to "color" when all characters are stripped', () => {
      const result = generateCSS('!@#$', PLUM_SCALE, 'hex');

      expect(result).toContain('--color-color-50:');
    });

    it('strips angle brackets from script-like names', () => {
      const result = generateCSS('<script>alert(1)</script>', PLUM_SCALE, 'hex');

      expect(result).not.toMatch(/[()<>]/);
    });

    it('collapses hyphens left by a stripped character between words', () => {
      const result = generateCSS('Tom & Jerry', PLUM_SCALE, 'hex');

      expect(result).toContain('--color-tom-jerry-50:');
      expect(result).not.toContain('tom--jerry');
    });

    it('collapses runs of hyphens from spaced or repeated separators', () => {
      expect(generateCSS('primary - color', PLUM_SCALE, 'hex')).toContain(
        '--color-primary-color-50:',
      );
      expect(generateCSS('A--B', PLUM_SCALE, 'hex')).toContain('--color-a-b-50:');
    });

    it('keeps a leading-digit name valid via the color- prefix', () => {
      // Sass variable names cannot start with a digit; the prefix guarantees they never do.
      expect(generateSCSS('123color', PLUM_SCALE, 'hex')).toContain('$color-123color-50:');
      expect(generateCSS('123color', PLUM_SCALE, 'hex')).toContain('--color-123color-50:');
    });
  });

  describe('generateSCSS', () => {
    it('generates SCSS variables', () => {
      const result = generateSCSS('Plum', PLUM_SCALE, 'hex');

      expect(result).toMatchSnapshot();
    });

    it('generates rgb-channels format', () => {
      const result = generateSCSS('Plum', PLUM_SCALE, 'rgb-channels');

      expect(result).toMatchSnapshot();
    });
  });

  describe('generateSVG', () => {
    it('generates SVG with colored rectangles', () => {
      const result = generateSVG('Plum', PLUM_SCALE);

      expect(result).toMatchSnapshot();
    });

    it('converts oklch tones to hex for SVG', () => {
      const result = generateSVG('Plum', PLUM_SCALE);

      // SVG should have hex colors, not oklch
      expect(result).not.toContain('oklch(');
      expect(result).toMatch(/fill="#[\da-f]{6}"/i);
    });

    it('escapes XML metacharacters in the title (invalid SVG otherwise)', () => {
      const result = generateSVG('Tom & Jerry <x>', PLUM_SCALE);

      expect(result).toContain('<title>Tom &amp; Jerry &lt;x&gt;</title>');
      // no raw & that isn't part of an entity
      expect(result).not.toMatch(/&(?!amp;|lt;|gt;)/);
    });

    it('escapes XML metacharacters in palette row labels', () => {
      const result = generatePaletteExport([{ name: 'A & <B>', steps: PLUM_SCALE }], {
        colorFormat: 'hex',
        formatType: 'svg',
      });

      expect(result).toContain('>A &amp; &lt;B&gt;</text>');
      expect(result).not.toMatch(/&(?!amp;|lt;|gt;)/);
    });
  });

  describe('generateExport', () => {
    it('delegates to correct generator based on format type', () => {
      const tailwind3 = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'tailwind3',
      });

      expect(tailwind3).toContain("'plum': {");

      const css = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'css',
      });

      expect(css).toContain('--color-plum-');
      expect(css).not.toContain("'plum': {");
    });

    it('generates tailwind4 format', () => {
      const result = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'tailwind4',
      });

      expect(result).toContain('--color-plum-50:');
    });

    it('generates scss format', () => {
      const result = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'scss',
      });

      expect(result).toContain('$color-plum-50:');
    });

    it('generates svg format', () => {
      const result = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'svg',
      });

      expect(result).toContain('<svg');
      expect(result).toContain('<title>Plum</title>');
    });

    it('returns empty string for unknown format type', () => {
      const result = generateExport('Plum', PLUM_SCALE, {
        colorFormat: 'hex',
        formatType: 'unknown' as ExportFormatType,
      });

      expect(result).toBe('');
    });
  });

  describe('generatePaletteExport', () => {
    const samplePalette = [
      { name: 'Primary', steps: PLUM_SCALE },
      { name: 'Secondary', steps: BLUE_SCALE },
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
      expect(result).toContain('--color-primary-50:');
      expect(result).toContain('/* Secondary */');
      expect(result).toContain('--color-secondary-50:');
    });

    it('generates scss format for palette', () => {
      const result = generatePaletteExport(samplePalette, {
        colorFormat: 'hex',
        formatType: 'scss',
      });

      expect(result).toContain('/* Primary */');
      expect(result).toContain('$color-primary-50:');
      expect(result).toContain('/* Secondary */');
      expect(result).toContain('$color-secondary-50:');
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

  describe('comment header sanitization', () => {
    it('neutralizes the */ block-comment terminator in CSS/SCSS/Tailwind 4 headers', () => {
      const css = generatePaletteExport([{ name: '*/ body{display:none} /*', steps: PLUM_SCALE }], {
        colorFormat: 'hex',
        formatType: 'css',
      });

      expect(css).toContain('/* * / body{display:none} /* */');
      expect(css).not.toContain('*/ body');

      const scss = generatePaletteExport([{ name: '*/ @import "x";', steps: PLUM_SCALE }], {
        colorFormat: 'hex',
        formatType: 'scss',
      });

      expect(scss).not.toContain('*/ @import');

      const tw4 = generatePaletteExport([{ name: '*/ x', steps: PLUM_SCALE }], {
        colorFormat: 'hex',
        formatType: 'tailwind4',
      });

      expect(tw4).toContain('/* * / x */');
    });

    it('collapses newlines so a name cannot escape the // comment (Tailwind 3)', () => {
      const result = generatePaletteExport([{ name: 'Brand\nMALICIOUS()', steps: PLUM_SCALE }], {
        colorFormat: 'hex',
        formatType: 'tailwind3',
      });

      expect(result).toContain('// Brand MALICIOUS()');
      expect(result).not.toMatch(/\nMALICIOUS/);
    });

    it('collapses Unicode line separators (U+2028/U+2029) in the // comment (Tailwind 3)', () => {
      const result = generatePaletteExport(
        [{ name: 'Brand\u2028LS()\u2029PS()', steps: PLUM_SCALE }],
        { colorFormat: 'hex', formatType: 'tailwind3' },
      );

      expect(result).toContain('// Brand LS() PS()');
      expect(result).not.toMatch(/[\u2028\u2029]/);
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
      const result = generateTailwind3('Plum', PLUM_SCALE, 'oklch');

      // Should contain original oklch values (or normalized)
      expect(result).toContain('oklch(');
    });

    it('clamps to sRGB when exporting oklch tones to hex', () => {
      const result = generateTailwind3('Plum', PLUM_SCALE, 'hex');

      // Should contain hex values
      expect(result).toMatch(/'50': '#[\da-f]{6}'/i);
    });
  });
});
