import { createColorEntry, CRIMSON, GREEN, SLATE } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';
import { createPalette } from '~/utils/generator';

import ReorderColors from '~/containers/ReorderColors';

import type { ColorEntry } from '~/types';

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPage: vi.fn(),
}));

function colorNames() {
  return getGeneratorStore()
    .getState()
    .colors.map(color => color.name);
}

/** Handles are labelled with their live position, so pass the position you expect it at. */
function getHandle(name: string, position: number) {
  return screen.getByRole('button', { name: `Reorder ${name}, position ${position} of 3` });
}

async function openPopover() {
  renderReorder();

  fireEvent.click(screen.getByRole('button', { name: 'Reorder colors' }));

  await waitFor(() => {
    expect(screen.getByText('Drag or use arrow keys')).toBeInTheDocument();
  });
}

function renderReorder() {
  const colors = [
    createColorEntry('Primary', CRIMSON),
    createColorEntry('Secondary', GREEN),
    createColorEntry('Tertiary', SLATE),
  ];

  setupStore(colors);

  return { ...render(<ReorderColors />), colors };
}

function setupStore(colors: ColorEntry[]) {
  const palette = createPalette(CRIMSON);

  palette.colors = colors;

  getGeneratorStore().setState({ ...palette, activeColorId: colors[0]?.id ?? null });
}

describe('ReorderColors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders the Reorder button', () => {
      renderReorder();

      expect(screen.getByRole('button', { name: 'Reorder colors' })).toBeInTheDocument();
    });

    it('renders the popover', async () => {
      await openPopover();

      expect(screen.getByTestId('ReorderColors')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('opens the popover with a draggable row per color', async () => {
      await openPopover();

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Tertiary')).toBeInTheDocument();
    });

    it('focuses the first handle on open so the arrow keys act immediately', async () => {
      await openPopover();

      await waitFor(() => {
        expect(getHandle('Primary', 1)).toHaveFocus();
      });
    });

    it('moves a color down with ArrowDown, keeping focus on it', async () => {
      await openPopover();

      fireEvent.keyDown(getHandle('Primary', 1), { key: 'ArrowDown' });

      expect(colorNames()).toEqual(['Secondary', 'Primary', 'Tertiary']);
      expect(getHandle('Primary', 2)).toHaveFocus();
    });

    it('moves a color up with ArrowUp', async () => {
      await openPopover();

      fireEvent.keyDown(getHandle('Tertiary', 3), { key: 'ArrowUp' });

      expect(colorNames()).toEqual(['Primary', 'Tertiary', 'Secondary']);
    });

    it('sends a color to the bottom with End and back to the top with Home', async () => {
      await openPopover();

      fireEvent.keyDown(getHandle('Primary', 1), { key: 'End' });
      expect(colorNames()).toEqual(['Secondary', 'Tertiary', 'Primary']);

      fireEvent.keyDown(getHandle('Primary', 3), { key: 'Home' });
      expect(colorNames()).toEqual(['Primary', 'Secondary', 'Tertiary']);
    });

    it('announces the move', async () => {
      await openPopover();

      fireEvent.keyDown(getHandle('Primary', 1), { key: 'ArrowDown' });

      expect(screen.getByRole('status')).toHaveTextContent('Primary moved to position 2 of 3');
    });

    it('ignores a move past either end', async () => {
      await openPopover();

      fireEvent.keyDown(getHandle('Primary', 1), { key: 'ArrowUp' });
      expect(colorNames()).toEqual(['Primary', 'Secondary', 'Tertiary']);

      fireEvent.keyDown(getHandle('Tertiary', 3), { key: 'ArrowDown' });
      expect(colorNames()).toEqual(['Primary', 'Secondary', 'Tertiary']);

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});
