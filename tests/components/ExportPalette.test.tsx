import { usePaletteStore } from '~/stores/paletteStore';
import { mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';
import { createPalette } from '~/utils/palette';

import ExportPalette from '~/components/ExportPalette';

import type { ColorEntry, PaletteState } from '~/types';

function createColorEntry(
  name: string,
  value: string,
  overrides?: ColorEntry['overrides'],
): ColorEntry {
  return { id: crypto.randomUUID(), name, value, ...(overrides && { overrides }) };
}

function createTestPalette(): PaletteState {
  const basePalette = createPalette('#FF0044');

  return {
    ...basePalette,
    colors: [createColorEntry('Primary', '#FF0044'), createColorEntry('Secondary', '#0066FF')],
  };
}

describe('ExportPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    usePaletteStore.setState(createTestPalette());
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<ExportPalette />);

      expect(container).toMatchSnapshot();
    });

    it('renders modal correctly when open', async () => {
      const { container } = render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('opens modal on button click', async () => {
      render(<ExportPalette />);

      const button = screen.getByRole('button', { name: /export all/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows all colors selected by default', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
      });
    });

    it('Select None deselects all colors', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /select none/i }));

      await waitFor(() => {
        expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
      });
    });

    it('Select All selects all colors', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // First deselect all
      fireEvent.click(screen.getByRole('button', { name: /select none/i }));

      await waitFor(() => {
        expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
      });

      // Then select all
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));

      await waitFor(() => {
        expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
      });
    });

    it('Copy All button copies selected scales', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /copy all/i }));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    it('Copy All is disabled when no colors selected', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /select none/i }));

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /copy all/i });

        expect(copyButton).toBeDisabled();
      });
    });
  });
});
