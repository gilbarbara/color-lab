import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { fireEvent, render, screen, within } from '~/test-utils';
import { createPalette } from '~/utils/palette';

import Preview from '~/components/Preview';

import type { ColorEntry, PaletteState } from '~/types';

const PRIMARY = 'oklch(0.62 0.245 19)';
const SECONDARY = 'oklch(0.59 0.236 263)';
const TERTIARY = 'oklch(0.73 0.175 162)';
const LIGHT = 'oklch(0.95 0.1 64)';
const DARK = 'oklch(0.2 0.2 302)';

function createColorEntry(name: string, value: string): ColorEntry {
  return { id: crypto.randomUUID(), name, value };
}

function createTestPalette(colors: Array<[string, string]>): PaletteState {
  const baseColor = colors[0]?.[1] ?? PRIMARY;
  const base = createPalette(baseColor);

  return {
    ...base,
    colors: colors.map(([name, value]) => createColorEntry(name, value)),
  };
}

function getToggleButton(): HTMLButtonElement {
  const section = screen.getByTestId('Preview');
  const button = section.querySelector('button');

  if (!button) {
    throw new Error('Toggle button not found');
  }

  return button as HTMLButtonElement;
}

function setupPalette(colors: Array<[string, string]>): PaletteState {
  const palette = createTestPalette(colors);
  const firstId = palette.colors[0]?.id ?? null;

  usePaletteStore.setState({
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
    setupPalette([
      ['Primary', PRIMARY],
      ['Secondary', SECONDARY],
    ]);
  });

  describe('Render', () => {
    it('renders collapsed', () => {
      useAppStore.setState({ showPreview: false });
      render(<Preview />);

      expect(screen.getByTestId('Preview')).toMatchSnapshot();
      expect(screen.queryByTestId('Preview-Header')).not.toBeInTheDocument();
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
      setupPalette([['Primary', PRIMARY]]);
      render(<Preview />);

      expect(screen.queryByRole('button', { name: /use .* as primary/i })).not.toBeInTheDocument();
    });

    it('shows color buttons with multiple colors', () => {
      setupPalette([
        ['Primary', PRIMARY],
        ['Secondary', SECONDARY],
        ['Tertiary', TERTIARY],
      ]);
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

      const secondaryId = usePaletteStore.getState().colors[1].id;

      expect(usePaletteStore.getState().previewColorId).toBe(secondaryId);
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

    it('theme toggle cycles auto -> light -> dark -> auto', () => {
      render(<Preview />);

      const section = screen.getByTestId('Preview');
      const themeButton = screen.getByRole('button', { name: 'Toggle preview theme' });

      // Auto for PRIMARY (L 0.62, middle range) with light app theme -> light.
      expect(section).toHaveClass('light');

      fireEvent.click(themeButton);
      expect(section).toHaveClass('light');

      fireEvent.click(themeButton);
      expect(section).toHaveClass('dark');

      fireEvent.click(themeButton);
      expect(section).toHaveClass('light');
    });

    it('auto theme resolves to dark for very light color', () => {
      setupPalette([['Pale', LIGHT]]);
      render(<Preview />);

      expect(screen.getByTestId('Preview')).toHaveClass('dark');
    });

    it('auto theme resolves to light for very dark color', () => {
      setupPalette([['Deep', DARK]]);
      render(<Preview />);

      expect(screen.getByTestId('Preview')).toHaveClass('light');
    });

    it('falls back to first color when previewColorId is stale', () => {
      usePaletteStore.setState({ previewColorId: 'nonexistent-id' });

      render(<Preview />);

      const header = screen.getByTestId('Preview-Header');

      expect(within(header).getByText('Primary')).toBeInTheDocument();
    });
  });
});
