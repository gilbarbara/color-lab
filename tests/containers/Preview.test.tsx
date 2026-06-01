import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, within } from '~/test-utils';

import Preview from '~/containers/Preview';

import type { GeneratorState } from '~/types';

function getToggleButton(): HTMLButtonElement {
  const section = screen.getByTestId('Preview');
  const button = section.querySelector('button');

  if (!button) {
    throw new Error('Toggle button not found');
  }

  return button as HTMLButtonElement;
}

function setupPalette(colors: number): GeneratorState {
  const palette = createTestPalette(colors);
  const firstId = palette.colors[0]?.id ?? null;

  getGeneratorStore().setState({
    ...palette,
    activeColorId: firstId,
    previewColorId: firstId,
  });

  return palette;
}

describe('Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ showPreview: true, previewScrollNonce: 0 });
    setupPalette(2);
  });

  describe('Render', () => {
    it('renders collapsed', () => {
      useAppStore.setState({ showPreview: false });
      render(<Preview />);

      expect(screen.getByTestId('Preview')).toMatchSnapshot();
      // Content stays mounted; the CSS collapse signals state via data-open.
      expect(screen.getByTestId('Preview').querySelector('[data-open]')).toHaveAttribute(
        'data-open',
        'false',
      );
    });

    it('renders expanded', () => {
      render(<Preview />);

      expect(screen.getByTestId('Preview-Header')).toMatchSnapshot('header');
      expect(screen.getByTestId('Preview-Toolbar')).toMatchSnapshot('toolbar');
      expect(screen.getByTestId('Preview-Controls')).toMatchSnapshot('controls');
      expect(screen.getByTestId('Preview-Cards')).toMatchSnapshot('cards');
    });
  });

  describe('Behavior', () => {
    it('omits color buttons with single color', () => {
      setupPalette(1);
      render(<Preview />);

      expect(screen.queryByRole('button', { name: /use .* as primary/i })).not.toBeInTheDocument();
    });

    it('shows color buttons with multiple colors', () => {
      setupPalette(3);
      render(<Preview />);

      const buttons = screen.getAllByRole('button', { name: /use .* as primary/i });

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicking a color updates previewColorId', () => {
      render(<Preview />);

      const secondaryButton = screen.getByRole('button', { name: 'Use Secondary as primary' });

      fireEvent.click(secondaryButton);

      const secondaryId = getGeneratorStore().getState().colors[1].id;

      expect(getGeneratorStore().getState().previewColorId).toBe(secondaryId);
      expect(screen.getByRole('button', { name: 'Use Secondary as primary' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Use Primary as primary' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('toggle button flips showPreview in store', () => {
      render(<Preview />);

      expect(useAppStore.getState().showPreview).toBe(true);

      fireEvent.click(getToggleButton());

      expect(useAppStore.getState().showPreview).toBe(false);

      fireEvent.click(getToggleButton());

      expect(useAppStore.getState().showPreview).toBe(true);
    });

    it('falls back to first color when previewColorId is stale', () => {
      getGeneratorStore().setState({ previewColorId: 'nonexistent-id' });

      render(<Preview />);

      const header = screen.getByTestId('Preview-Header');

      expect(within(header).getByText('Primary')).toBeInTheDocument();
    });
  });
});
