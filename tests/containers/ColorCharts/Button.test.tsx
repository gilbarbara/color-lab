import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';

import ColorChartsButton from '~/containers/ColorCharts/Button';

import type { GeneratorState } from '~/types';

function getButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'View Charts for Primary' });
}

function getColors() {
  return getGeneratorStore().getState().colors;
}

function setupPalette(colors: number): GeneratorState {
  const palette = createTestPalette(colors);
  const firstId = palette.colors[0]?.id ?? null;

  getGeneratorStore().setState({
    ...palette,
    activeColorId: firstId,
    chartColorIds: new Set(),
    previewColorId: firstId,
  });

  return palette;
}

describe('ColorCharts/Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPalette(3);
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const [colorEntry] = getColors();

      render(<ColorChartsButton colorEntry={colorEntry} />);

      expect(getButton()).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('toggles only this color on a plain click', () => {
      const [first, second] = getColors();

      render(<ColorChartsButton colorEntry={first} />);

      fireEvent.click(getButton());

      const { chartColorIds } = getGeneratorStore().getState();

      expect(chartColorIds.has(first.id)).toBe(true);
      expect(chartColorIds.has(second.id)).toBe(false);
    });

    it('toggles off on a second click', () => {
      const [colorEntry] = getColors();

      render(<ColorChartsButton colorEntry={colorEntry} />);

      fireEvent.click(getButton());
      fireEvent.click(getButton());

      expect(getGeneratorStore().getState().chartColorIds.has(colorEntry.id)).toBe(false);
    });

    it('shift-click opens every color when this one is closed', () => {
      const colors = getColors();
      const ids = colors.map(color => color.id);

      render(<ColorChartsButton colorEntry={colors[0]} />);

      fireEvent.click(getButton(), { shiftKey: true });

      const { chartColorIds } = getGeneratorStore().getState();

      expect(chartColorIds.size).toBe(ids.length);
      ids.forEach(id => expect(chartColorIds.has(id)).toBe(true));
    });

    it('shift-click closes every color when this one is open', () => {
      const colors = getColors();

      getGeneratorStore().setState({ chartColorIds: new Set(colors.map(color => color.id)) });

      render(<ColorChartsButton colorEntry={colors[0]} />);

      fireEvent.click(getButton(), { shiftKey: true });

      expect(getGeneratorStore().getState().chartColorIds.size).toBe(0);
    });
  });
});
