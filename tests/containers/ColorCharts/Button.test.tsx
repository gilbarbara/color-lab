import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';

import ColorChartsButton from '~/containers/ColorCharts/Button';

import type { GeneratorState } from '~/types';

function getButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'View Charts' });
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
      const { id } = getGeneratorStore().getState().colors[0];

      render(<ColorChartsButton id={id} />);

      expect(getButton()).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('toggles only this color on a plain click', () => {
      const [first, second] = getGeneratorStore()
        .getState()
        .colors.map(color => color.id);

      render(<ColorChartsButton id={first} />);

      fireEvent.click(getButton());

      const { chartColorIds } = getGeneratorStore().getState();

      expect(chartColorIds.has(first)).toBe(true);
      expect(chartColorIds.has(second)).toBe(false);
    });

    it('toggles off on a second click', () => {
      const { id } = getGeneratorStore().getState().colors[0];

      render(<ColorChartsButton id={id} />);

      fireEvent.click(getButton());
      fireEvent.click(getButton());

      expect(getGeneratorStore().getState().chartColorIds.has(id)).toBe(false);
    });

    it('shift-click opens every color when this one is closed', () => {
      const ids = getGeneratorStore()
        .getState()
        .colors.map(color => color.id);

      render(<ColorChartsButton id={ids[0]} />);

      fireEvent.click(getButton(), { shiftKey: true });

      const { chartColorIds } = getGeneratorStore().getState();

      expect(chartColorIds.size).toBe(ids.length);
      ids.forEach(id => expect(chartColorIds.has(id)).toBe(true));
    });

    it('shift-click closes every color when this one is open', () => {
      const ids = getGeneratorStore()
        .getState()
        .colors.map(color => color.id);

      getGeneratorStore().setState({ chartColorIds: new Set(ids) });

      render(<ColorChartsButton id={ids[0]} />);

      fireEvent.click(getButton(), { shiftKey: true });

      expect(getGeneratorStore().getState().chartColorIds.size).toBe(0);
    });
  });
});
