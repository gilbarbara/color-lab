import { useAppStore } from '~/stores/appStore';
import { mockIsP3Supported } from '~/test-mocks';
import { fireEvent, render, screen } from '~/test-utils';

import GamutToggle from '~/containers/Palette/GamutToggle';

describe('GamutToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsP3Supported.mockReturnValue(true);
    useAppStore.setState({ gamut: 'p3' });
  });

  describe('Render', () => {
    it('renders dropdown trigger when P3 is supported', () => {
      const { container } = render(<GamutToggle />);

      expect(container).toMatchSnapshot();
    });

    it('renders warning color when gamut is srgb', () => {
      useAppStore.setState({ gamut: 'srgb' });
      const { container } = render(<GamutToggle />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('opens the menu and switches gamut to srgb', async () => {
      render(<GamutToggle />);

      fireEvent.click(screen.getByRole('button', { name: 'Color gamut' }));

      const srgbItem = await screen.findByRole('menuitemradio', { name: /SRGB/ });

      fireEvent.click(srgbItem);

      expect(useAppStore.getState().gamut).toBe('srgb');
    });

    it('is a no-op when selecting the already-active gamut', async () => {
      render(<GamutToggle />);

      fireEvent.click(screen.getByRole('button', { name: 'Color gamut' }));

      const p3Item = await screen.findByRole('menuitemradio', { name: /^P3/ });

      fireEvent.click(p3Item);

      expect(useAppStore.getState().gamut).toBe('p3');
    });

    it('surfaces the P3 detection note in the menu', async () => {
      render(<GamutToggle />);

      fireEvent.click(screen.getByRole('button', { name: 'Color gamut' }));

      await expect(
        screen.findByText(/verify p3 support on your display/i),
      ).resolves.toBeInTheDocument();
    });
  });
});
