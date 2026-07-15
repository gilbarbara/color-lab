import userEvent from '@testing-library/user-event';

import { useAppStore } from '~/stores/appStore';
import { createTestPalette } from '~/test-fixtures';
import { getGeneratorStore } from '~/test-mocks';
import { act, fireEvent, render, screen, waitFor } from '~/test-utils';

import Options from '~/containers/Palette/Options';

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
  });

  describe('Behavior', () => {
    it('toggles saturationOverride via Switch', () => {
      render(<Options />);

      const overrideSwitch = screen.getByRole('switch', {
        name: /Apply saturation to all colors/,
      });

      fireEvent.click(overrideSwitch);

      expect(getGeneratorStore().getState().globalOptions.saturationOverride).toBe(true);
    });

    describe('with a stale saturation left by a removed/reordered first color', () => {
      const base = createTestPalette(1);
      const defaultSaturation = base.globalOptions.saturation;
      const staleSaturation = defaultSaturation === 50 ? 60 : 50;

      beforeEach(() => {
        getGeneratorStore().setState({
          ...base,
          globalOptions: {
            ...base.globalOptions,
            saturation: staleSaturation,
            saturationOverride: false,
          },
        });
      });

      it('shows the current first color saturation, not the stale value', () => {
        render(<Options />);

        expect(screen.getByRole('slider', { name: /saturation/i })).toHaveValue(
          String(defaultSaturation),
        );
      });

      it('keeps the palette reset disabled', () => {
        render(<Options />);

        expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
      });

      it('seeds saturation from the current first color when enabling the override', () => {
        render(<Options />);

        fireEvent.click(screen.getByRole('switch', { name: /Apply saturation to all colors/ }));

        const { globalOptions } = getGeneratorStore().getState();

        expect(globalOptions.saturationOverride).toBe(true);
        expect(globalOptions.saturation).toBe(defaultSaturation);
      });
    });

    describe('with a lock that is not a step at the current step count', () => {
      const base = createTestPalette(1);

      beforeEach(() => {
        // 300 is a valid step at 11 (the default) but not at 7. Dropping steps leaves the lock
        // out of range: it stays in state and is surfaced as a warning rather than silently cleared.
        getGeneratorStore().setState({
          ...base,
          globalOptions: { ...base.globalOptions, lock: 300, steps: 7 },
        });
      });

      it('flags the out-of-range lock with the step count instead of showing it selected', () => {
        render(<Options />);

        expect(screen.getByTestId('LockOptions')).toHaveTextContent('300 • not in 7 steps');
      });

      it('applies the warning styling to the lock trigger', () => {
        render(<Options />);

        expect(screen.getByTestId('LockOptions')).toHaveClass('bg-warning-400');
      });
    });

    it('resets saturation to default when disabling saturationOverride', () => {
      const base = createTestPalette(1);
      const defaultSaturation = base.globalOptions.saturation;
      const customSaturation = defaultSaturation === 50 ? 60 : 50;

      getGeneratorStore().setState({
        ...base,
        globalOptions: {
          ...base.globalOptions,
          saturationOverride: true,
          saturation: customSaturation,
        },
      });
      render(<Options />);

      fireEvent.click(screen.getByRole('switch', { name: /Apply saturation to all colors/ }));

      const { globalOptions } = getGeneratorStore().getState();

      expect(globalOptions.saturationOverride).toBe(false);
      expect(globalOptions.saturation).toBe(defaultSaturation);
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

    it('wires the mode button group to the store', () => {
      render(<Options />);

      fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));

      expect(getGeneratorStore().getState().globalOptions.mode).toBe('dark');
    });

    it('updates saturation via the slider when override is on', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      fireEvent.change(screen.getByRole('slider', { name: 'Saturation' }), {
        target: { value: '40' },
      });

      expect(getGeneratorStore().getState().globalOptions.saturation).toBe(40);
    });

    it('commits steps on keyboard change (onChangeEnd)', async () => {
      const user = userEvent.setup();
      const base = createTestPalette(1);

      render(<Options />);

      act(() => screen.getByRole('slider', { name: 'Steps' }).focus());
      await user.keyboard('{ArrowRight}');

      expect(getGeneratorStore().getState().globalOptions.steps).toBe(base.globalOptions.steps + 1);
    });

    it('commits saturation on keyboard change (onChangeEnd)', async () => {
      const user = userEvent.setup();
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, saturationOverride: true },
      });
      render(<Options />);

      act(() => screen.getByRole('slider', { name: 'Saturation' }).focus());
      await user.keyboard('{ArrowRight}');

      expect(getGeneratorStore().getState().globalOptions.saturation).not.toBe(
        base.globalOptions.saturation,
      );
    });

    it('clears the variant via the None option', async () => {
      const user = userEvent.setup();
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, variant: 'vibrant' },
      });
      render(<Options />);

      const trigger = screen.getByTestId('VariantOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      await user.click(await screen.findByRole('option', { name: 'None' }));

      expect(getGeneratorStore().getState().globalOptions.variant).toBeUndefined();
    });

    it('clears the lock via the None option', async () => {
      const user = userEvent.setup();
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, lock: 500 },
      });
      render(<Options />);

      const trigger = screen.getByTestId('LockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      await user.click(await screen.findByRole('option', { name: 'None' }));

      expect(getGeneratorStore().getState().globalOptions.lock).toBeUndefined();
    });

    it('resets steps to default via the slider reset button', () => {
      const base = createTestPalette(1);

      getGeneratorStore().setState({
        ...base,
        globalOptions: { ...base.globalOptions, steps: 15 },
      });
      render(<Options />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset Steps to default' }));

      expect(getGeneratorStore().getState().globalOptions.steps).toBe(base.globalOptions.steps);
    });

    it('resets saturation to default via the slider reset button', () => {
      const base = createTestPalette(1);
      const customSaturation = base.globalOptions.saturation === 40 ? 50 : 40;

      getGeneratorStore().setState({
        ...base,
        globalOptions: {
          ...base.globalOptions,
          saturationOverride: true,
          saturation: customSaturation,
        },
      });
      render(<Options />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset Saturation to default' }));

      expect(getGeneratorStore().getState().globalOptions.saturation).toBe(
        base.globalOptions.saturation,
      );
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
