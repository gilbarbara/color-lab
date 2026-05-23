import userEvent from '@testing-library/user-event';

import { useAppStore } from '~/stores/appStore';
import { usePaletteStore } from '~/stores/paletteStore';
import { createTestPalette } from '~/test-fixtures';
import { fireEvent, render, screen, waitFor, within } from '~/test-utils';

import Options from '~/pages/Generator/Palette/Options';

vi.mock('~/hooks/useRafCallback', () => ({
  default: (callback: unknown) => callback,
}));

describe('Options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3' });
    usePaletteStore.setState(createTestPalette(1));
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('renders with saturationOverride enabled', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true, saturation: 50 },
      });
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('renders with variant and lock selected', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: { ...base.globalOptions, variant: 'vibrant', lock: 500 },
      });
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('renders dark mode label', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: { ...base.globalOptions, mode: 'dark' },
      });
      render(<Options />);

      expect(screen.getByText('Dark scale')).toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('toggles mode via Switch', () => {
      render(<Options />);

      const modeSwitch = screen.getByRole('switch', { name: /Light scale/ });

      fireEvent.click(modeSwitch);

      expect(usePaletteStore.getState().globalOptions.mode).toBe('dark');
    });

    it('toggles saturationOverride via Switch', () => {
      render(<Options />);

      const overrideSwitch = screen.getByRole('switch', {
        name: /Apply saturation to all colors/,
      });

      fireEvent.click(overrideSwitch);

      expect(usePaletteStore.getState().globalOptions.saturationOverride).toBe(true);
    });

    it('disables saturation slider when saturationOverride is off', () => {
      render(<Options />);

      expect(screen.getByRole('group', { name: 'Saturation' })).toHaveClass('opacity-disabled');
    });

    it('enables saturation slider when saturationOverride is on', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      expect(screen.getByRole('group', { name: 'Saturation' })).not.toHaveClass('opacity-disabled');
    });

    it('updates steps via slider input change', () => {
      render(<Options />);
      const stepsGroup = screen.getByRole('group', { name: 'Steps' });
      const stepsSlider = within(stepsGroup).getByRole('slider');

      fireEvent.change(stepsSlider, { target: { value: '7' } });

      expect(usePaletteStore.getState().globalOptions.steps).toBe(7);
    });

    it('selects a variant via the listbox', async () => {
      const user = userEvent.setup();

      render(<Options />);

      const trigger = screen.getByRole('button', { name: 'Select variant Variant options' });

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: 'Vibrant' });

      await user.click(option);

      expect(usePaletteStore.getState().globalOptions.variant).toBe('vibrant');
    });

    it('selects a lock step via the listbox', async () => {
      const user = userEvent.setup();

      render(<Options />);

      const trigger = screen.getByRole('button', { name: 'Select lock Lock options' });

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: '500' });

      await user.click(option);

      expect(usePaletteStore.getState().globalOptions.lock).toBe(500);
    });

    it('disables variant select trigger when saturationOverride is on', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      const trigger = screen.getByRole('button', { name: 'Select variant Variant options' });

      expect(trigger).toHaveAttribute('data-disabled', 'true');
    });

    it('resets palette options to defaults', () => {
      const base = createTestPalette(1);

      usePaletteStore.setState({
        ...base,
        globalOptions: {
          ...base.globalOptions,
          steps: 15,
          variant: 'vibrant',
          mode: 'dark',
        },
      });
      render(<Options />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

      const { globalOptions } = usePaletteStore.getState();

      expect(globalOptions.steps).toBe(base.globalOptions.steps);
      expect(globalOptions.variant).toBe(base.globalOptions.variant);
      expect(globalOptions.mode).toBe(base.globalOptions.mode);
    });
  });
});
