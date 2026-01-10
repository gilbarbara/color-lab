import { convert, parseCSS } from 'colorizr';

import type {
  ExportColorFormat,
  ExportFormatType,
  ExportOptions,
  ScaleExportData,
  ScaleSteps,
} from '~/types';

/**
 * Generate CSS format for palette (multiple scales).
 */
function generatePaletteCSS(palette: ScaleExportData[], colorFormat: ExportColorFormat): string {
  return palette
    .map(({ name, steps }) => `/* ${name} */\n${generateCSS(name, steps, colorFormat)}`)
    .join('\n\n');
}

/**
 * Generate SCSS format for palette (multiple scales).
 */
function generatePaletteSCSS(palette: ScaleExportData[], colorFormat: ExportColorFormat): string {
  return palette
    .map(({ name, steps }) => `/* ${name} */\n${generateSCSS(name, steps, colorFormat)}`)
    .join('\n\n');
}

/**
 * Generate SVG format for palette (multiple scales).
 * Creates stacked rows with visible text labels, one per color.
 */
function generatePaletteSVG(palette: ScaleExportData[]): string {
  const rectWidth = 100;
  const rectHeight = 100;
  const textHeight = 20;
  const rowSpacing = 10;
  const rowHeight = textHeight + rectHeight + rowSpacing;
  const maxSteps = Math.max(...palette.map(({ steps }) => Object.keys(steps).length));
  const totalWidth = maxSteps * rectWidth;
  const totalHeight = palette.length * rowHeight - rowSpacing;

  const rows = palette
    .map(({ name, steps }, rowIndex) => {
      const rowY = rowIndex * rowHeight;
      const textY = rowY + 14; // baseline offset for text
      const rectsY = rowY + textHeight;

      const toneEntries = Object.entries(steps);
      const rects = toneEntries
        .map(([, color], colIndex) => {
          const hexColor = convert(color, 'hex');

          return `  <rect width="${rectWidth}" height="${rectHeight}" fill="${hexColor}" x="${colIndex * rectWidth}" y="${rectsY}"/>`;
        })
        .join('\n');

      return `  <text x="0" y="${textY}" font-family="system-ui, sans-serif" font-size="14" fill="#333">${name}</text>\n${rects}`;
    })
    .join('\n');

  return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">\n${rows}\n</svg>`;
}

/**
 * Generate Tailwind 3 format for palette (multiple scales).
 */
function generatePaletteTailwind3(
  palette: ScaleExportData[],
  colorFormat: ExportColorFormat,
): string {
  return palette
    .map(({ name, steps }) => `// ${name}\n${generateTailwind3(name, steps, colorFormat)}`)
    .join('\n\n');
}

/**
 * Generate Tailwind 4 format for palette (multiple scales).
 */
function generatePaletteTailwind4(
  palette: ScaleExportData[],
  colorFormat: ExportColorFormat,
): string {
  return palette
    .map(({ name, steps }) => `/* ${name} */\n${generateTailwind4(name, steps, colorFormat)}`)
    .join('\n\n');
}

/**
 * Normalize a color name for use in CSS variables/SCSS.
 * Converts to lowercase and replaces spaces with hyphens.
 */
function normalizeColorName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Convert a color string to the target format.
 * Uses colorizr's convert() directly to preserve wide gamut colors in OKLCH.
 * Colors are only clamped to sRGB when converting to hex/hsl/rgb formats.
 */
export function formatColorValue(color: string, format: ExportColorFormat): string {
  switch (format) {
    case 'oklch': {
      return convert(color, 'oklch');
    }
    case 'hsl': {
      return convert(color, 'hsl');
    }
    case 'rgb': {
      return convert(color, 'rgb');
    }
    case 'rgb-channels': {
      const rgb = parseCSS(convert(color, 'rgb'));

      if (typeof rgb === 'object' && 'r' in rgb) {
        return `${rgb.r} ${rgb.g} ${rgb.b}`;
      }

      return color;
    }
    case 'hex': {
      return convert(color, 'hex');
    }
    default: {
      return color;
    }
  }
}

/**
 * Generate CSS format (CSS custom properties).
 */
export function generateCSS(
  name: string,
  tones: ScaleSteps,
  colorFormat: ExportColorFormat,
): string {
  const normalizedName = normalizeColorName(name);
  const lines = Object.entries(tones).map(
    ([tone, color]) => `--${normalizedName}-${tone}: ${formatColorValue(color, colorFormat)};`,
  );

  return lines.join('\n');
}

/**
 * Main entry point for generating export code.
 */
export function generateExport(name: string, tones: ScaleSteps, options: ExportOptions): string {
  const { colorFormat, formatType } = options;

  switch (formatType) {
    case 'tailwind3': {
      return generateTailwind3(name, tones, colorFormat);
    }
    case 'tailwind4': {
      return generateTailwind4(name, tones, colorFormat);
    }
    case 'css': {
      return generateCSS(name, tones, colorFormat);
    }
    case 'scss': {
      return generateSCSS(name, tones, colorFormat);
    }
    case 'svg': {
      return generateSVG(name, tones);
    }
    default: {
      return '';
    }
  }
}

/**
 * Main entry point for generating palette export code (multiple scales).
 */
export function generatePaletteExport(palette: ScaleExportData[], options: ExportOptions): string {
  const { colorFormat, formatType } = options;

  switch (formatType) {
    case 'tailwind3': {
      return generatePaletteTailwind3(palette, colorFormat);
    }
    case 'tailwind4': {
      return generatePaletteTailwind4(palette, colorFormat);
    }
    case 'css': {
      return generatePaletteCSS(palette, colorFormat);
    }
    case 'scss': {
      return generatePaletteSCSS(palette, colorFormat);
    }
    case 'svg': {
      return generatePaletteSVG(palette);
    }
    default: {
      return '';
    }
  }
}

/**
 * Generate SCSS format (SCSS variables).
 */
export function generateSCSS(
  name: string,
  tones: ScaleSteps,
  colorFormat: ExportColorFormat,
): string {
  const normalizedName = normalizeColorName(name);
  const lines = Object.entries(tones).map(
    ([tone, color]) => `$${normalizedName}-${tone}: ${formatColorValue(color, colorFormat)};`,
  );

  return lines.join('\n');
}

/**
 * Generate SVG format for Figma import.
 * Creates colored rectangles for each tone.
 */
export function generateSVG(name: string, tones: ScaleSteps): string {
  const toneEntries = Object.entries(tones);
  const rectWidth = 100;
  const rectHeight = 100;
  const totalWidth = toneEntries.length * rectWidth;

  const rects = toneEntries
    .map(([, color], index) => {
      // SVG needs hex colors, so convert if needed
      const hexColor = convert(color, 'hex');

      return `  <rect width="${rectWidth}" height="${rectHeight}" fill="${hexColor}" x="${index * rectWidth}" y="0"/>`;
    })
    .join('\n');

  return `<svg width="${totalWidth}" height="${rectHeight}" viewBox="0 0 ${totalWidth} ${rectHeight}">\n  <title>${name}</title>\n${rects}\n</svg>`;
}

/**
 * Generate Tailwind 3 format (JS object).
 */
export function generateTailwind3(
  name: string,
  tones: ScaleSteps,
  colorFormat: ExportColorFormat,
): string {
  const normalizedName = normalizeColorName(name);
  const lines = Object.entries(tones).map(
    ([tone, color]) => `  '${tone}': '${formatColorValue(color, colorFormat)}',`,
  );

  return `'${normalizedName}': {\n${lines.join('\n')}\n},`;
}

/**
 * Generate Tailwind 4 format (CSS custom properties with --color- prefix).
 */
export function generateTailwind4(
  name: string,
  tones: ScaleSteps,
  colorFormat: ExportColorFormat,
): string {
  const normalizedName = normalizeColorName(name);
  const lines = Object.entries(tones).map(
    ([tone, color]) =>
      `--color-${normalizedName}-${tone}: ${formatColorValue(color, colorFormat)};`,
  );

  return lines.join('\n');
}

/**
 * Get the available color formats for a given format type.
 */
export function getAvailableColorFormats(formatType: ExportFormatType): ExportColorFormat[] {
  if (formatType === 'svg') {
    return ['hex'];
  }

  const formats: ExportColorFormat[] = ['oklch', 'hex', 'hsl', 'rgb'];

  if (formatType === 'css' || formatType === 'scss') {
    formats.push('rgb-channels');
  }

  return formats;
}

/**
 * Check if a color format is available for the given format type.
 * RGB channels is only available for CSS and SCSS.
 */
export function isColorFormatAvailable(
  formatType: ExportFormatType,
  colorFormat: ExportColorFormat,
): boolean {
  if (colorFormat === 'rgb-channels') {
    return formatType === 'css' || formatType === 'scss';
  }

  // SVG only supports hex (it converts internally anyway)
  if (formatType === 'svg') {
    return colorFormat === 'hex';
  }

  return true;
}

/**
 * Format type display labels.
 */
export const formatTypeLabels: Record<ExportFormatType, string> = {
  css: 'CSS',
  scss: 'SCSS',
  svg: 'SVG / Figma',
  tailwind3: 'Tailwind 3',
  tailwind4: 'Tailwind 4',
};

/**
 * Color format display labels.
 */
export const colorFormatLabels: Record<ExportColorFormat, string> = {
  hex: 'Hex code',
  hsl: 'HSL',
  oklch: 'OKLCH',
  rgb: 'RGB',
  'rgb-channels': 'RGB channels',
};

/**
 * Format types in display order.
 */
export const formatTypes: ExportFormatType[] = ['tailwind4', 'tailwind3', 'css', 'scss', 'svg'];

/**
 * Color formats in display order.
 */
export const colorFormats: ExportColorFormat[] = ['oklch', 'hex', 'hsl', 'rgb', 'rgb-channels'];
