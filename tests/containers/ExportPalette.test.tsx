import { DESIGN_SYSTEM_PRESETS } from '~/config/presets';
import { useAppStore } from '~/stores/appStore';
import { createTestPalette, CYAN, GRAY, RED } from '~/test-fixtures';
import { getGeneratorStore, mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import ExportPalette from '~/containers/ExportPalette';

describe('ExportPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    useAppStore.setState({ exportFormatType: 'css', exportColorFormat: 'oklch', gamut: 'p3' });
    getGeneratorStore().setState(createTestPalette(2));
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { baseElement } = render(<ExportPalette />);

      expect(baseElement).toMatchSnapshot();
    });

    it('renders modal correctly when open', async () => {
      // Opposite hues + a neutral gray, with the Open Color preset and the
      // default saturationOverride=false, so each scale must keep its own
      // natural saturation. The bug forces the first color's (RED) saturation
      // onto the rest — most visibly turning the neutral gray into a chromatic
      // ramp.
      const state = createTestPalette([RED, CYAN, GRAY]);

      getGeneratorStore().setState({
        ...state,
        globalOptions: { ...state.globalOptions, ...DESIGN_SYSTEM_PRESETS.opencolor },
      });

      const { baseElement } = render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(baseElement).toMatchSnapshot();
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

      const preview = screen.getByRole('dialog').querySelector('pre')?.textContent ?? '';

      // The preview is the CSS export for both selected scales (Primary + Secondary).
      expect(preview).toContain('/* Primary */');
      expect(preview).toContain('--color-primary-500:');
      expect(preview).toContain('/* Secondary */');
      expect(preview).toContain('--color-secondary-500:');

      fireEvent.click(screen.getByRole('button', { name: /copy all/i }));

      // Copy All copies exactly the code shown in the preview.
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(preview);
      });
    });

    it('toggles a single scale on and off', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Deselect just the Primary scale (the delete branch).
      fireEvent.click(screen.getByRole('checkbox', { name: /primary/i }));

      await waitFor(() => {
        expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
      });

      // Re-select it (the add branch).
      fireEvent.click(screen.getByRole('checkbox', { name: /primary/i }));

      await waitFor(() => {
        expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
      });
    });

    it('per-scale Copy button copies only that scale', async () => {
      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Copy Secondary' }));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('--color-secondary-500:'),
        );
      });

      // A single-scale copy has no palette comment header and excludes other scales.
      const copied = mockClipboard.writeText.mock.calls.at(-1)?.[0] ?? '';

      expect(copied).not.toContain('/* Secondary */');
      expect(copied).not.toContain('--color-primary-');
    });

    it('hides selection controls for a single-color palette', async () => {
      getGeneratorStore().setState(createTestPalette(1));

      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/of 1 selected/i)).not.toBeInTheDocument();

      // The single scale is still exported.
      const preview = screen.getByRole('dialog').querySelector('pre')?.textContent ?? '';

      expect(preview).toContain('--color-primary-500:');
    });

    it('renders scale rows in the sRGB gamut', async () => {
      useAppStore.setState({ gamut: 'srgb' });

      render(<ExportPalette />);

      fireEvent.click(screen.getByRole('button', { name: /export all/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Rows render with sRGB-converted swatch colors (ScaleItem's sRGB branch).
      expect(screen.getByRole('checkbox', { name: /primary/i })).toBeInTheDocument();
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
