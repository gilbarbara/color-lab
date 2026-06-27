import userEvent from '@testing-library/user-event';

import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import Options from '~/containers/Palette/Header/Options';

vi.mock('~/hooks/useRafCallback', () => ({
  default: (callback: unknown) => callback,
}));

describe('Options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ gamut: 'p3' });
    getGeneratorStore().setState(createTestPalette(1));
  });

  describe('Render', () => {
    it('renders default state', () => {
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('renders with saturationOverride enabled', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true, saturation: 50 },
      });
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('renders with variant and lock selected', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, variant: 'vibrant', lock: 500 },
      });
      const { container } = render(<Options />);

      expect(container).toMatchSnapshot();
    });

    it('reflects the selected mode', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, mode: 'dark' },
      });
      render(<Options />);

      expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    });
  });

  describe('Behavior', () => {
    it('toggles mode via the button group', () => {
      render(<Options />);

      fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
      expect(getGeneratorStore().getState().globalOptions.mode).toBe('dark');

      fireEvent.click(screen.getByRole('radio', { name: 'Reversed' }));
      expect(getGeneratorStore().getState().globalOptions.mode).toBe('reversed');
    });

    it('toggles saturationOverride via Switch', () => {
      render(<Options />);

      const overrideSwitch = screen.getByRole('switch', {
        name: /Apply saturation to all colors/,
      });

      fireEvent.click(overrideSwitch);

      expect(getGeneratorStore().getState().globalOptions.saturationOverride).toBe(true);
    });

    it('disables saturation slider when saturationOverride is off', () => {
      render(<Options />);

      expect(screen.getByRole('group', { name: 'Saturation' })).toHaveClass('opacity-disabled');
    });

    it('enables saturation slider when saturationOverride is on', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      expect(screen.getByRole('group', { name: 'Saturation' })).not.toHaveClass('opacity-disabled');
    });

    it('updates steps via slider input change', () => {
      render(<Options />);
      const stepsSlider = screen.getByRole('slider', { name: 'Steps' });

      fireEvent.change(stepsSlider, { target: { value: '7' } });

      expect(getGeneratorStore().getState().globalOptions.steps).toBe(7);
    });

    it('selects a variant via the listbox', async () => {
      const user = userEvent.setup();

      render(<Options />);

      const trigger = screen.getByTestId('VariantOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: 'Vibrant' });

      await user.click(option);

      expect(getGeneratorStore().getState().globalOptions.variant).toBe('vibrant');
    });

    it('selects a lock step via the listbox', async () => {
      const user = userEvent.setup();

      render(<Options />);

      const trigger = screen.getByTestId('LockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: '500' });

      await user.click(option);

      expect(getGeneratorStore().getState().globalOptions.lock).toBe(500);
    });

    it('disables variant select trigger when saturationOverride is on', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      const trigger = screen.getByRole('button', { name: 'Select variant Variant' });

      expect(trigger).toHaveAttribute('data-disabled', 'true');
    });

    it('resets palette options to defaults', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
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

      const { globalOptions } = getGeneratorStore().getState();

      expect(globalOptions.steps).toBe(base.globalOptions.steps);
      expect(globalOptions.variant).toBe(base.globalOptions.variant);
      expect(globalOptions.mode).toBe(base.globalOptions.mode);
    });
  });
});
