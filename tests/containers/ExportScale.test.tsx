import { useAppStore } from '~/stores/appStore';
import { CRIMSON_SCALE } from '~/test-fixtures';
import { mockAddToast, mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import ExportScale from '~/containers/ExportScale';

const defaultProps = {
  name: 'primary',
  steps: CRIMSON_SCALE,
};

describe('ExportScale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    useAppStore.setState({ exportFormatType: 'css', exportColorFormat: 'hex' });
  });

  describe('Render', () => {
    it('renders correctly', () => {
      const { container } = render(<ExportScale {...defaultProps} />);

      expect(container).toMatchSnapshot();
    });

    it('renders modal correctly when open', async () => {
      const { baseElement } = render(<ExportScale {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(baseElement).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('copies code to clipboard on Copy click', async () => {
      render(<ExportScale {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Copied to clipboard',
          color: 'success',
        }),
      );
    });

    it('shows error toast when clipboard fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      render(<ExportScale {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to copy',
            color: 'danger',
          }),
        );
      });
    });
  });
});
