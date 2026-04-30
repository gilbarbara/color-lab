import { act, renderHook } from '@testing-library/react';

import usePalette from '~/hooks/usePalette';
import { usePaletteStore } from '~/stores/paletteStore';
import { getChromaAsPercentage } from '~/utils/color';
import { createPalette, getDefaultGlobalOptions } from '~/utils/palette';

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: '/', search: '' }),
  useNavigate: () => vi.fn(),
}));

describe('hooks/usePalette', () => {
  beforeEach(() => {
    const palette = createPalette('#FF0044');

    usePaletteStore.setState({ ...palette, activeColorId: palette.colors[0].id });
  });

  describe('computed values', () => {
    it('returns baseSaturation from first color', () => {
      const { result } = renderHook(() => usePalette());

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage('#FF0044'));
    });

    it('returns defaultOptions from first color', () => {
      const { result } = renderHook(() => usePalette());

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions('#FF0044'));
    });

    it('updates baseSaturation when first color changes', () => {
      const { result } = renderHook(() => usePalette());

      const initialSaturation = result.current.baseSaturation;

      act(() => {
        result.current.updateColor(0, { value: '#00FF00' });
      });

      expect(result.current.baseSaturation).toBe(getChromaAsPercentage('#00FF00'));
      expect(result.current.baseSaturation).not.toBe(initialSaturation);
    });

    it('updates defaultOptions when first color changes', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateColor(0, { value: '#0000FF' });
      });

      expect(result.current.defaultOptions).toEqual(getDefaultGlobalOptions('#0000FF'));
    });
  });

  describe('actions', () => {
    it('addColor updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      expect(result.current.colors).toHaveLength(2);
      expect(result.current.colors[1].value).toBe('#00FF00');
    });

    it('addColor with custom name', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00', 'Custom');
      });

      expect(result.current.colors[1].name).toBe('Custom');
    });

    it('removeColor updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      expect(result.current.colors).toHaveLength(2);

      act(() => {
        result.current.removeColor(0);
      });

      expect(result.current.colors).toHaveLength(1);
      expect(result.current.colors[0].value).toBe('#00FF00');
    });

    it('updateColor updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateColor(0, { name: 'New Name' });
      });

      expect(result.current.colors[0].name).toBe('New Name');
    });

    it('updateColorOverrides updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateColorOverrides(0, { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toEqual({ maxLightness: 0.9 });
    });

    it('clearColorOverrides updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateColorOverrides(0, { maxLightness: 0.9 });
      });

      expect(result.current.colors[0].overrides).toBeDefined();

      act(() => {
        result.current.clearColorOverrides(0);
      });

      expect(result.current.colors[0].overrides).toBeUndefined();
    });

    it('updateGlobalOptions updates state', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: 2.0 });
      });

      expect(result.current.globalOptions.lightnessCurve).toBe(2.0);
    });

    it('resetGlobalOptions resets to defaults', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.updateGlobalOptions({ lightnessCurve: 2.0, steps: 15 });
      });

      expect(result.current.globalOptions.lightnessCurve).toBe(2.0);

      act(() => {
        result.current.resetGlobalOptions();
      });

      const expectedDefaults = getDefaultGlobalOptions('#FF0044');

      expect(result.current.globalOptions.lightnessCurve).toBe(expectedDefaults.lightnessCurve);
      expect(result.current.globalOptions.steps).toBe(expectedDefaults.steps);
    });

    it('resetPalette creates new palette', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
        result.current.updateGlobalOptions({ lightnessCurve: 2.0 });
      });

      expect(result.current.colors).toHaveLength(2);

      act(() => {
        result.current.resetPalette();
      });

      expect(result.current.colors).toHaveLength(1);
      expect(result.current.colors[0].name).toBe('Primary');
      expect(result.current.globalOptions).toEqual(
        getDefaultGlobalOptions(result.current.colors[0].value),
      );
    });
  });

  describe('activeColor', () => {
    it('initializes activeColorId to first color id', () => {
      const { result } = renderHook(() => usePalette());

      expect(result.current.activeColorId).toBe(result.current.colors[0].id);
    });

    it('setActiveColor with valid id updates active', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      const secondId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(secondId);
      });

      expect(result.current.activeColorId).toBe(secondId);
    });

    it('setActiveColor with unknown id is a no-op', () => {
      const { result } = renderHook(() => usePalette());
      const initialActive = result.current.activeColorId;

      act(() => {
        result.current.setActiveColor('does-not-exist');
      });

      expect(result.current.activeColorId).toBe(initialActive);
    });

    it('addColor activates the new color', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      expect(result.current.activeColorId).toBe(result.current.colors[1].id);
    });

    it('removeColor of active picks next neighbor', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
        result.current.addColor('#0000FF');
      });

      const middleId = result.current.colors[1].id;
      const lastId = result.current.colors[2].id;

      act(() => {
        result.current.setActiveColor(middleId);
      });

      expect(result.current.activeColorId).toBe(middleId);

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(lastId);
    });

    it('removeColor of last (active) falls back to previous', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      const firstId = result.current.colors[0].id;
      const lastId = result.current.colors[1].id;

      act(() => {
        result.current.setActiveColor(lastId);
      });

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(firstId);
    });

    it('removeColor of non-active leaves active unchanged', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      const firstId = result.current.colors[0].id;

      act(() => {
        result.current.setActiveColor(firstId);
      });

      act(() => {
        result.current.removeColor(1);
      });

      expect(result.current.activeColorId).toBe(firstId);
    });

    it('resetPalette sets active to new first color', () => {
      const { result } = renderHook(() => usePalette());

      act(() => {
        result.current.addColor('#00FF00');
      });

      act(() => {
        result.current.setActiveColor(result.current.colors[1].id);
      });

      act(() => {
        result.current.resetPalette();
      });

      expect(result.current.activeColorId).toBe(result.current.colors[0].id);
    });
  });
});
