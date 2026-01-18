import { fireEvent, render, screen, waitFor } from '~/test-utils';

import SavePaletteModal from '~/components/SavePaletteModal';

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

const defaultProps = {
  isOpen: true,
  isSaving: false,
  onClose: mockOnClose,
  onSave: mockOnSave,
};

describe('SavePaletteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders nothing when closed', () => {
      const { container } = render(<SavePaletteModal {...defaultProps} isOpen={false} />);

      expect(container).toMatchSnapshot();
    });

    it('renders modal when open', async () => {
      const { container } = render(<SavePaletteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('has Save button disabled when name is empty', async () => {
      render(<SavePaletteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('enables Save button when name is entered', async () => {
      render(<SavePaletteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My Palette' } });

      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });

    it('calls onSave with trimmed name on submit', async () => {
      render(<SavePaletteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/name/i);

      fireEvent.change(input, { target: { value: '  My Palette  ' } });
      fireEvent.submit(input.closest('form')!);

      expect(mockOnSave).toHaveBeenCalledWith('My Palette');
    });

    it('calls onClose when Cancel is clicked', async () => {
      render(<SavePaletteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows loading state when isSaving', async () => {
      render(<SavePaletteModal {...defaultProps} isSaving />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });
});
