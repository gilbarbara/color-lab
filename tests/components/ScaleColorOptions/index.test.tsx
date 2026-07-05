import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CRIMSON } from '~/test-fixtures';
import { act, fireEvent, render, screen, within } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';
import { getChromaFraction } from '~/utils/scale-options';

import ScaleColorOptions from '~/components/ScaleColorOptions';

import type { GlobalScaleOptions } from '~/types';

vi.mock('~/hooks/useRafCallback', () => ({
  default: (callback: unknown) => callback,
}));

const mockTrackEvent = vi.fn();

vi.mock('~/utils/analytics', () => ({
  trackEvent: (...arguments_: unknown[]) => mockTrackEvent(...arguments_),
  trackPage: vi.fn(),
}));

type Props = Parameters<typeof ScaleColorOptions>[0];

function createDefaultProps(overrides: Partial<Props> = {}): Props {
  const options: GlobalScaleOptions = getDefaultGlobalOptions(CRIMSON);

  return {
    defaultOptions: options,
    options,
    onReset: vi.fn(),
    onUpdate: vi.fn(),
    seedColor: CRIMSON,
    ...overrides,
  };
}

describe('ScaleColorOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onReset when the panel Reset button is clicked', () => {
    const onReset = vi.fn();

    render(<ScaleColorOptions {...createDefaultProps({ onReset })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  describe('Render', () => {
    it('renders default state', () => {
      render(<ScaleColorOptions {...createDefaultProps()} />);

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });

    it('renders all chips as default when range options match defaults (per-color, no overrides)', () => {
      // ColorActions passes defaultOptions={globalOptions} and options={globalOptions,
      // ...overrides}; with no overrides every value equals its default, so every chip
      // (including Split endpoints) must render as default, not modified.
      const rangeOptions: GlobalScaleOptions = {
        ...getDefaultGlobalOptions(CRIMSON),
        chromaCurve: { low: 0.5, high: 0.8 },
        hueShift: { low: 1, high: -5 },
        lightnessCurve: { low: 0.9, high: 1.2 },
        minLightness: 0.48,
        maxLightness: 0.95,
      };

      render(
        <ScaleColorOptions
          {...createDefaultProps({ defaultOptions: rangeOptions, options: rangeOptions })}
        />,
      );

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });

    it('renders with non-default options and lock (Reset buttons enabled)', () => {
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: {
              ...defaults,
              chromaCurve: 0.5,
              lightnessCurve: 2.0,
              minLightness: 0.1,
              maxLightness: 0.95,
              lock: 500,
            },
          })}
          showLock
        />,
      );

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });
  });

  describe('LightnessRange', () => {
    it('renders the tooltip', async () => {
      const user = userEvent.setup();

      render(<ScaleColorOptions {...createDefaultProps()} />);

      await user.hover(screen.getByLabelText('Description for Lightness Range'));

      await waitFor(() => {
        expect(screen.getByTestId('Tooltip')).toBeInTheDocument();
      });

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('Tooltip').firstChild).toMatchSnapshot();
    });

    it('updates via second-handle keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expectedMax = Number((defaults.maxLightness - 0.01).toFixed(2));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const sliders = screen.getAllByRole('slider', { name: 'Lightness Range' });

      act(() => sliders[1].focus());
      await user.keyboard('{ArrowLeft}');

      expect(onUpdate).toHaveBeenLastCalledWith({
        minLightness: defaults.minLightness,
        maxLightness: expectedMax,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('options:lightness_range', {
        min: defaults.minLightness,
        max: expectedMax,
      });
    });

    it('Reset button calls onUpdate with default values', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, minLightness: 0.1, maxLightness: 0.9 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Lightness Range to default' }));

      expect(onUpdate).toHaveBeenCalledWith({
        minLightness: defaults.minLightness,
        maxLightness: defaults.maxLightness,
      });
    });
  });

  describe('LightnessCurve', () => {
    it('renders the tooltip', async () => {
      const user = userEvent.setup();

      render(<ScaleColorOptions {...createDefaultProps()} />);

      await user.hover(screen.getByLabelText('Description for Lightness Curve'));

      await waitFor(() => {
        expect(screen.getByTestId('Tooltip')).toBeInTheDocument();
      });

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('Tooltip').firstChild).toMatchSnapshot();
    });

    it('updates via slider keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expected = Number(((defaults.lightnessCurve as number) + 0.01).toFixed(2));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Lightness Curve Amount' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ lightnessCurve: expected });
      expect(mockTrackEvent).toHaveBeenCalledWith('options:lightness_curve', { value: expected });
    });

    it('per-slider Reset button calls onUpdate with default value', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lightnessCurve: 2.0 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Lightness Curve to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ lightnessCurve: defaults.lightnessCurve });
    });

    it('per-slider Reset button is disabled when value matches default', () => {
      render(<ScaleColorOptions {...createDefaultProps()} />);

      expect(
        screen.getByRole('button', { name: 'Reset Lightness Curve to default' }),
      ).toBeDisabled();
    });

    it('derives the tab from the value shape (Split selected for a range)', () => {
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lightnessCurve: { low: 1.5, high: 1 } },
          })}
        />,
      );

      expect(screen.getByRole('tab', { name: 'Split', selected: true })).toBeInTheDocument();
    });

    it('Simple→Split seeds { low, high } losslessly from the current scalar', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(<ScaleColorOptions {...createDefaultProps({ defaultOptions: defaults, onUpdate })} />);

      const tabs = within(screen.getByRole('tablist', { name: 'Lightness curve mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Split' }));

      expect(onUpdate).toHaveBeenCalledWith({
        lightnessCurve: { low: defaults.lightnessCurve, high: defaults.lightnessCurve },
      });
    });

    it('re-selecting the active tab is a no-op', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(<ScaleColorOptions {...createDefaultProps({ defaultOptions: defaults, onUpdate })} />);

      const tabs = within(screen.getByRole('tablist', { name: 'Lightness curve mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Simple' }));

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('Split→Simple collapses the range to its rounded midpoint', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lightnessCurve: { low: 1, high: 2 } },
            onUpdate,
          })}
        />,
      );

      const tabs = within(screen.getByRole('tablist', { name: 'Lightness curve mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Simple' }));

      expect(onUpdate).toHaveBeenCalledWith({ lightnessCurve: 1.5 });
    });

    it('emits a { low, high } range from the Low slider in Split mode', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lightnessCurve: { low: 1, high: 1.5 } },
            onUpdate,
          })}
        />,
      );

      const slider = screen.getByRole('slider', { name: 'Low' });

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ lightnessCurve: { low: 1.01, high: 1.5 } });
    });
  });

  describe('ChromaCurve', () => {
    it('renders the tooltip', async () => {
      const user = userEvent.setup();

      render(<ScaleColorOptions {...createDefaultProps()} />);

      await user.hover(screen.getByLabelText('Description for Chroma Curve'));

      await waitFor(() => {
        expect(screen.getByTestId('Tooltip')).toBeInTheDocument();
      });

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('Tooltip').firstChild).toMatchSnapshot();
    });

    it('updates via slider keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expected = Number(((defaults.chromaCurve as number) + 0.1).toFixed(1));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Chroma Curve Amount' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{PageUp}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: expected });
      expect(mockTrackEvent).toHaveBeenCalledWith('options:chroma_curve', { value: expected });
    });

    it('Reset button calls onUpdate with default value', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: 0.5 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Chroma Curve to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ chromaCurve: defaults.chromaCurve });
    });

    it('re-selecting the active tab is a no-op', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(<ScaleColorOptions {...createDefaultProps({ defaultOptions: defaults, onUpdate })} />);

      const tabs = within(screen.getByRole('tablist', { name: 'Chroma curve mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Simple' }));

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('Peak slider is disabled when Amount is 0', () => {
      render(<ScaleColorOptions {...createDefaultProps()} />);

      expect(screen.getByRole('slider', { name: 'Peak' })).toBeDisabled();
    });

    it('Peak slider emits { amount, peak } once moved off center', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: 0.4 },
            onUpdate,
          })}
        />,
      );

      const slider = screen.getByRole('slider', { name: 'Peak' });

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: { amount: 0.4, peak: 0.51 } });

      await user.keyboard('{PageUp}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: { amount: 0.4, peak: 0.6 } });
    });

    it('Amount keeps the scalar form while the peak is centered', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: 0.4 },
            onUpdate,
          })}
        />,
      );

      const group = screen.getByRole('group', { name: 'Chroma Curve Amount' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{PageUp}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: 0.5 });
    });

    it('Simple→Split seeds { low, high } from the seedColor chroma fraction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const fraction = getChromaFraction(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({ defaultOptions: defaults, onUpdate, seedColor: CRIMSON })}
        />,
      );

      const tabs = within(screen.getByRole('tablist', { name: 'Chroma curve mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Split' }));

      expect(onUpdate).toHaveBeenCalledWith({ chromaCurve: { low: fraction, high: fraction } });
    });

    it('emits a { low, high } range from the Low slider in Split mode', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: { low: 0.2, high: 0.8 } },
            onUpdate,
          })}
        />,
      );

      const slider = screen.getByRole('slider', { name: 'Low' });

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: { low: 0.21, high: 0.8 } });
    });

    it('Reset flips the tab back to Simple (scalar default)', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: { low: 0.2, high: 0.85 } },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Chroma Curve to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ chromaCurve: defaults.chromaCurve });
    });
  });

  describe('HueShift', () => {
    it('renders the tooltip', async () => {
      const user = userEvent.setup();

      render(<ScaleColorOptions {...createDefaultProps()} />);

      await user.hover(screen.getByLabelText('Description for Hue Shift'));

      await waitFor(() => {
        expect(screen.getByTestId('Tooltip')).toBeInTheDocument();
      });

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('Tooltip').firstChild).toMatchSnapshot();
    });

    it('defaults to Simple and emits a scalar on slider interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(<ScaleColorOptions {...createDefaultProps({ defaultOptions: defaults, onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Hue Shift Amount' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ hueShift: 1 });
    });

    it('Simple→Split seeds the symmetric { low, high } pair', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, hueShift: 15 },
            onUpdate,
          })}
        />,
      );

      const tabs = within(screen.getByRole('tablist', { name: 'Hue shift mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Split' }));

      expect(onUpdate).toHaveBeenCalledWith({ hueShift: { low: -15, high: 15 } });
    });

    it('re-selecting the active tab is a no-op', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(<ScaleColorOptions {...createDefaultProps({ defaultOptions: defaults, onUpdate })} />);

      const tabs = within(screen.getByRole('tablist', { name: 'Hue shift mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Simple' }));

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('Split→Simple collapses to the high end', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, hueShift: { low: -10, high: 20 } },
            onUpdate,
          })}
        />,
      );

      const tabs = within(screen.getByRole('tablist', { name: 'Hue shift mode' }));

      await user.click(tabs.getByRole('tab', { name: 'Simple' }));

      expect(onUpdate).toHaveBeenCalledWith({ hueShift: 20 });
    });

    it('Reset button calls onUpdate with the default value', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, hueShift: 15 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Hue Shift to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ hueShift: defaults.hueShift });
    });

    it('emits a { low, high } range from the Low slider in Split mode', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, hueShift: { low: 0, high: 0 } },
            onUpdate,
          })}
        />,
      );

      const slider = screen.getByRole('slider', { name: 'Low' });

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ hueShift: { low: 1, high: 0 } });
    });
  });

  describe('Lock', () => {
    it('updates to 500', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} showLock />);

      const trigger = screen.getByTestId('ColorLockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: '500' });

      await user.click(option);

      expect(onUpdate).toHaveBeenLastCalledWith({
        lock: 500,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('color:lock', { value: '500' });
    });

    it('updates to None', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            onUpdate,
            defaultOptions: defaults,
            options: { ...defaults, lock: 500 },
          })}
          showLock
        />,
      );

      const trigger = screen.getByTestId('ColorLockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      const option = await screen.findByRole('option', { name: 'None' });

      await user.click(option);

      expect(onUpdate).toHaveBeenLastCalledWith({
        lock: undefined,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('color:lock', { value: 'none' });
    });

    it('omits "None" when a global lock is set (a per-color unlock is unrepresentable)', async () => {
      const user = userEvent.setup();
      const defaults: GlobalScaleOptions = { ...getDefaultGlobalOptions(CRIMSON), lock: 500 };

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lock: 500 },
          })}
          showLock
        />,
      );

      const trigger = screen.getByTestId('ColorLockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      expect(screen.queryByRole('option', { name: 'None' })).not.toBeInTheDocument();
      expect(screen.getByRole('option', { name: '500' })).toBeInTheDocument();
    });

    it('offers "None" when there is no global lock (clears the per-color override)', async () => {
      const user = userEvent.setup();

      render(<ScaleColorOptions {...createDefaultProps()} showLock />);

      const trigger = screen.getByTestId('ColorLockOptions');

      await user.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

      expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    });

    it('hides the badge when the lock is inherited from global (no color override)', () => {
      const defaults: GlobalScaleOptions = { ...getDefaultGlobalOptions(CRIMSON), lock: 500 };

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lock: 500 },
          })}
          showLock
        />,
      );

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('ColorLock').querySelector('span[data-invisible]')).toHaveAttribute(
        'data-invisible',
        'true',
      );
    });

    it('shows the badge when the color has its own lock override', () => {
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lock: 300 },
          })}
          showLock
        />,
      );

      // eslint-disable-next-line testing-library/no-node-access
      expect(screen.getByTestId('ColorLock').querySelector('span[data-invisible]')).toHaveAttribute(
        'data-invisible',
        'false',
      );
    });
  });
});
