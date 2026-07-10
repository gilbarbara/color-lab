import { createColorEntry, CRIMSON, GREEN, SLATE } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';
import { createPalette } from '~/utils/generator';

import ReorderColors from '~/containers/ReorderColors';

import type { ColorEntry } from '~/types';

vi.mock('~/utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPage: vi.fn(),
}));

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
      renderReorder();

      fireEvent.click(screen.getByRole('button', { name: 'Reorder colors' }));

      await waitFor(() => {
        expect(screen.getByText('Drag to reorder')).toBeInTheDocument();
      });

      expect(screen.getByTestId('ReorderColors')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('opens the popover with a draggable row per color', async () => {
      renderReorder();

      fireEvent.click(screen.getByRole('button', { name: 'Reorder colors' }));

      await waitFor(() => {
        expect(screen.getByText('Drag to reorder')).toBeInTheDocument();
      });

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Tertiary')).toBeInTheDocument();
    });
  });
});
