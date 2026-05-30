import { mockAddToast, mockClipboard } from '~/test-mocks';
import { copyToClipboard } from '~/utils/clipboard';

describe('utils/clipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('copyToClipboard', () => {
    it('writes the value and shows a success toast by default', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyToClipboard('value');

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('value');
      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Copied to clipboard',
        color: 'success',
      });
    });

    it('writes the value without a toast when showToast is false', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyToClipboard('value', false);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('value');
      expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('shows a danger toast when writing fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('denied'));

      const result = await copyToClipboard('value');

      expect(result).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Failed to copy',
        color: 'danger',
      });
    });

    it('suppresses the danger toast when showToast is false', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('denied'));

      const result = await copyToClipboard('value', false);

      expect(result).toBe(false);
      expect(mockAddToast).not.toHaveBeenCalled();
    });
  });
});
