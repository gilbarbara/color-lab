import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, within } from '~/test-utils';

import Preview from '~/containers/Preview';

import type { GeneratorState } from '~/types';

function getColorRadioGroup(): HTMLElement {
  return screen.getByRole('radiogroup', { name: 'Preview color' });
}

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

      expect(screen.getByTestId('Preview')).toMatchSnapshot();
    });

    it('renders the Typography view', () => {
      render(<Preview />);

      fireEvent.click(screen.getByRole('tab', { name: 'Typography' }));

      expect(screen.getByTestId('Preview-Typography')).toBeInTheDocument();
      expect(screen.queryByTestId('Preview-Controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('Preview-Cards')).not.toBeInTheDocument();

      expect(screen.getByTestId('Preview')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('omits the color radiogroup with a single color', () => {
      setupPalette(1);
      render(<Preview />);

      // Scoped by name: the Controls demo renders its own unrelated radiogroup.
      expect(screen.queryByRole('radiogroup', { name: 'Preview color' })).not.toBeInTheDocument();
    });

    it('shows a radio per color, with the preview color checked', () => {
      setupPalette(3);
      render(<Preview />);

      const radios = within(getColorRadioGroup()).getAllByRole('radio');

      expect(radios).toHaveLength(3);
      expect(radios[0]).toHaveAccessibleName('Primary');
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
      expect(radios[2]).not.toBeChecked();
    });

    it('clicking a color updates previewColorId', () => {
      render(<Preview />);

      fireEvent.click(screen.getByRole('radio', { name: 'Secondary' }));

      const secondaryId = getGeneratorStore().getState().colors[1].id;

      expect(getGeneratorStore().getState().previewColorId).toBe(secondaryId);
      expect(screen.getByRole('radio', { name: 'Secondary' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Primary' })).not.toBeChecked();
    });

    it('exposes the radiogroup as a single tab stop', () => {
      setupPalette(3);
      render(<Preview />);

      const radios = within(getColorRadioGroup()).getAllByRole('radio');

      // Roving tabindex: only the checked radio is reachable with Tab.
      expect(radios[0]).toHaveAttribute('tabindex', '0');
      expect(radios[1]).toHaveAttribute('tabindex', '-1');
      expect(radios[2]).toHaveAttribute('tabindex', '-1');
    });

    it('arrow keys move the selection and focus', () => {
      render(<Preview />);

      fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary' }), { key: 'ArrowRight' });

      const secondary = screen.getByRole('radio', { name: 'Secondary' });

      expect(secondary).toBeChecked();
      expect(secondary).toHaveFocus();
      expect(getGeneratorStore().getState().previewColorId).toBe(
        getGeneratorStore().getState().colors[1].id,
      );
    });

    it('arrow keys wrap around at both ends', () => {
      render(<Preview />);

      // Forward past the last radio wraps to the first.
      fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary' }), { key: 'ArrowRight' });
      fireEvent.keyDown(screen.getByRole('radio', { name: 'Secondary' }), { key: 'ArrowRight' });

      expect(screen.getByRole('radio', { name: 'Primary' })).toBeChecked();

      // Backward past the first radio wraps to the last.
      fireEvent.keyDown(screen.getByRole('radio', { name: 'Primary' }), { key: 'ArrowLeft' });

      expect(screen.getByRole('radio', { name: 'Secondary' })).toBeChecked();
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

    it('defaults to the Components view', () => {
      render(<Preview />);

      expect(screen.getByTestId('Preview-Controls')).toBeInTheDocument();
      expect(screen.getByTestId('Preview-Cards')).toBeInTheDocument();
      expect(screen.queryByTestId('Preview-Typography')).not.toBeInTheDocument();
    });
  });
});
