import { createColorEntry, createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { render, screen } from '~/test-utils';
import { getEffectiveOptions } from '~/utils/generator';

import ScaleOptions from '~/containers/ColorInfo/ScaleOptions';

import type { ColorEntry, GlobalScaleOptions } from '~/types';

/** Mirrors Palette/List: the panel always receives the color's *effective* options. */
function renderFor(colorEntry: ColorEntry, globalOptions: GlobalScaleOptions) {
  getGeneratorStore().setState({ colors: [colorEntry], globalOptions });

  return render(
    <ScaleOptions
      colorEntry={colorEntry}
      options={getEffectiveOptions(colorEntry, globalOptions)}
    />,
  );
}

/** The `<dd>` sibling of a row's `<dt>` — where the value spans and their status classes live. */
function rowValue(label: string): HTMLElement {
  const term = screen.getByText(label);

  return term.nextElementSibling as HTMLElement;
}

describe('ColorInfo/ScaleOptions', () => {
  const base = createTestPalette(1);

  beforeEach(() => {
    vi.clearAllMocks();
    getGeneratorStore().setState(base);
  });

  describe('Render', () => {
    it('renders the default rows', () => {
      const { container } = renderFor(base.colors[0], base.globalOptions);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Saturation row', () => {
    it('is hidden while the override is off', () => {
      renderFor(base.colors[0], { ...base.globalOptions, saturationOverride: false });

      expect(screen.queryByText('Saturation')).not.toBeInTheDocument();
    });

    it('shows the global value, marked custom, while the override is on', () => {
      renderFor(base.colors[0], {
        ...base.globalOptions,
        saturation: 42,
        saturationOverride: true,
      });

      expect(screen.getByText('Saturation')).toBeInTheDocument();
      // Enabling the override is itself a departure from the default, so the row is never 'default'.
      expect(rowValue('Saturation')).toHaveTextContent('42%');
      expect(rowValue('Saturation').querySelector('span')).toHaveClass('text-secondary-600');
    });

    it('ignores a stale saturation left behind while the override is off', () => {
      // `saturation` is dead state with the override off — the row must not surface it.
      renderFor(base.colors[0], {
        ...base.globalOptions,
        saturation: 99,
        saturationOverride: false,
      });

      expect(screen.queryByText('99%')).not.toBeInTheDocument();
    });
  });

  describe('Row status', () => {
    it('marks an untouched option as default', () => {
      renderFor(base.colors[0], base.globalOptions);

      expect(rowValue('Steps').querySelector('span')).toHaveClass('text-foreground');
    });

    it('marks a global that differs from the default as custom', () => {
      renderFor(base.colors[0], { ...base.globalOptions, steps: 15 });

      expect(rowValue('Steps')).toHaveTextContent('15');
      expect(rowValue('Steps').querySelector('span')).toHaveClass('text-secondary-600');
    });

    it('marks a per-color override as override', () => {
      const { minLightness } = base.globalOptions;
      const colorEntry = createColorEntry('Primary', base.colors[0].value, { maxLightness: 0.9 });

      renderFor(colorEntry, base.globalOptions);

      // Only the overridden half of the row lights up; the untouched min stays default-colored.
      expect(screen.getByText('0.9')).toHaveClass('text-secondary-600');
      expect(screen.getByText(String(minLightness))).toHaveClass('text-foreground');
    });
  });
});
