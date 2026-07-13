import { DESIGN_SYSTEM_PRESETS } from '~/config/presets';
import { CURVE_OPTION_KEYS } from '~/config/scale';
import { CRIMSON } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { act, fireEvent, render, screen } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';
import { createPalette, getDefaultGlobalOptions } from '~/utils/generator';

import ColorPresets from '~/components/ColorPresets';

import type { GlobalScaleOptions } from '~/types';

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPage: vi.fn(),
}));

function setupStore(globalOptionsOverrides: Partial<GlobalScaleOptions> = {}) {
  const palette = createPalette(CRIMSON);

  getGeneratorStore().setState({
    ...palette,
    globalOptions: { ...palette.globalOptions, ...globalOptionsOverrides },
    activeColorId: palette.colors[0].id,
    previewColorId: palette.colors[0].id,
  });
}

describe('ColorPresets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders the placeholder trigger with no reset by default', () => {
      setupStore();

      render(<ColorPresets />);

      expect(screen.getByTestId('ColorPresets')).toMatchSnapshot();
    });

    it('reflects the active preset and shows the reset when options match', () => {
      setupStore(DESIGN_SYSTEM_PRESETS.tailwind);

      render(<ColorPresets />);

      expect(screen.getByTestId('ColorPresets')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('lists all four presets in the menu', async () => {
      setupStore();

      render(<ColorPresets />);

      fireEvent.click(screen.getByRole('button', { name: 'Apply a preset' }));

      await screen.findByRole('menuitemradio', { name: 'Tailwind' });

      expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
    });

    it('applies a preset and tracks the event', async () => {
      setupStore();

      render(<ColorPresets />);

      fireEvent.click(screen.getByRole('button', { name: 'Apply a preset' }));

      fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Material' }));

      expect(getGeneratorStore().getState().globalOptions).toMatchObject(
        DESIGN_SYSTEM_PRESETS.material,
      );
      expect(trackEvent).toHaveBeenCalledWith('preset:apply', { value: 'material' });
      await expect(screen.findByRole('button', { name: 'Material' })).resolves.toBeInTheDocument();
    });

    it('drops the match when a curve option changes', () => {
      setupStore(DESIGN_SYSTEM_PRESETS.tailwind);

      render(<ColorPresets />);

      expect(screen.getByRole('button', { name: 'Tailwind' })).toBeInTheDocument();

      act(() => {
        getGeneratorStore().getState().updateGlobalOptions({ minLightness: 0.5 });
      });

      expect(screen.getByRole('button', { name: 'Apply a preset' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset preset' })).not.toBeInTheDocument();
    });

    it('resets the curve options to defaults and tracks the event', () => {
      setupStore(DESIGN_SYSTEM_PRESETS.tailwind);

      render(<ColorPresets />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset preset' }));

      const defaults = getDefaultGlobalOptions(CRIMSON);
      const { globalOptions } = getGeneratorStore().getState();

      CURVE_OPTION_KEYS.forEach(key => {
        expect(globalOptions[key]).toEqual(defaults[key]);
      });
      expect(trackEvent).toHaveBeenCalledWith('preset:reset');
      expect(screen.getByRole('button', { name: 'Apply a preset' })).toBeInTheDocument();
    });
  });
});
